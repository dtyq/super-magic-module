<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Domain\RecycleBin\Service;

use Dtyq\SuperMagic\Application\RecycleBin\DTO\RestoreConflictDTO;
use Dtyq\SuperMagic\Application\RecycleBin\DTO\RestorePreviewItemDTO;
use Dtyq\SuperMagic\Domain\RecycleBin\Entity\RecycleBinEntity;
use Dtyq\SuperMagic\Domain\RecycleBin\Enum\RecycleBinResourceType;
use Dtyq\SuperMagic\Domain\RecycleBin\Enum\RestoreConflictResolution;
use Dtyq\SuperMagic\Domain\RecycleBin\Enum\RestoreConflictType;
use Dtyq\SuperMagic\Domain\RecycleBin\Repository\Facade\RecycleBinRepositoryInterface;
use Dtyq\SuperMagic\Domain\SuperAgent\Entity\ProjectEntity;
use Dtyq\SuperMagic\Domain\SuperAgent\Entity\TopicEntity;
use Dtyq\SuperMagic\Domain\SuperAgent\Repository\Facade\ProjectMemberRepositoryInterface;
use Dtyq\SuperMagic\Domain\SuperAgent\Repository\Facade\ProjectRepositoryInterface;
use Dtyq\SuperMagic\Domain\SuperAgent\Repository\Facade\TaskFileRepositoryInterface;
use Dtyq\SuperMagic\Domain\SuperAgent\Repository\Facade\TopicRepositoryInterface;
use Dtyq\SuperMagic\Domain\SuperAgent\Repository\Facade\WorkspaceRepositoryInterface;
use Hyperf\DbConnection\Db;
use Hyperf\Logger\LoggerFactory;
use Psr\Log\LoggerInterface;
use RuntimeException;
use Throwable;

use function Hyperf\Translation\trans;

/**
 * Recycle bin restore domain service.
 *
 * Handles workspace, project, topic, and file restore (with cascade).
 * File restore supports explicit conflict resolution via conflict_resolutions map.
 */
class RecycleBinRestoreDomainService
{
    protected LoggerInterface $logger;

    public function __construct(
        protected RecycleBinRepositoryInterface $recycleBinRepository,
        protected WorkspaceRepositoryInterface $workspaceRepository,
        protected ProjectRepositoryInterface $projectRepository,
        protected TopicRepositoryInterface $topicRepository,
        protected TaskFileRepositoryInterface $taskFileRepository,
        protected ProjectMemberRepositoryInterface $projectMemberRepository,
        LoggerFactory $loggerFactory
    ) {
        $this->logger = $loggerFactory->get(self::class);
    }

    /**
     * Batch restore resources (partial success allowed).
     *
     * @param array<string, array<string, string>> $conflictResolutions resource_id → [conflict_type → resolution]
     * @return array{succeeded: RecycleBinEntity[], failed: array{entity: RecycleBinEntity, error: string}[]}
     */
    public function restoreBatch(
        array $resourceIds,
        RecycleBinResourceType $resourceType,
        string $userId,
        array $conflictResolutions = []
    ): array {
        $entities = $this->recycleBinRepository->findLatestByResourceIds($resourceIds, $resourceType, $userId);

        if (empty($entities)) {
            return ['succeeded' => [], 'failed' => []];
        }

        $succeeded = [];
        $failed = [];

        foreach ($entities as $entity) {
            try {
                $this->restoreSingle($entity, $userId, $conflictResolutions);
                $succeeded[] = $entity;
            } catch (Throwable $e) {
                $this->logger->error('Failed to restore resource', [
                    'recycle_bin_id' => $entity->getId(),
                    'resource_type' => $entity->getResourceType()->value,
                    'resource_id' => $entity->getResourceId(),
                    'error' => $e->getMessage(),
                ]);

                $failed[] = [
                    'entity' => $entity,
                    'error' => $e->getMessage(),
                ];
            }
        }

        return ['succeeded' => $succeeded, 'failed' => $failed];
    }

    /**
     * Preview file conflicts for a list of resource IDs.
     * Read-only; no side effects.
     *
     * @return array{items_with_conflict: RestorePreviewItemDTO[], items_no_conflict: RestorePreviewItemDTO[]}
     */
    public function previewFileConflicts(array $resourceIds, string $userId): array
    {
        $itemsWithConflict = [];
        $itemsNoConflict = [];

        if (empty($resourceIds)) {
            return ['items_with_conflict' => [], 'items_no_conflict' => []];
        }

        $entities = $this->recycleBinRepository->findLatestByResourceIds(
            $resourceIds,
            RecycleBinResourceType::File,
            $userId
        );

        foreach ($entities as $entity) {
            $fileId = (int) $entity->getResourceId();
            $file = $this->taskFileRepository->getByIdWithTrash($fileId);

            // File permanently deleted or purged from recycle bin — no actionable conflict
            if ($file === null || $entity->getRemovedAt() !== null || $entity->getPurgedAt() !== null) {
                $itemsNoConflict[] = new RestorePreviewItemDTO(
                    resourceId: (string) $fileId,
                    resourceName: $entity->getResourceName(),
                    isDirectory: false,
                );
                continue;
            }

            $parentId = $file->getParentId();

            // Step 1: detect parent_missing
            if ($parentId !== null && $parentId > 0) {
                $parent = $this->taskFileRepository->getByIdWithTrash($parentId);
                if ($parent === null || $parent->getDeletedAt() !== null || ! $parent->getIsDirectory()) {
                    $itemsWithConflict[] = new RestorePreviewItemDTO(
                        resourceId: (string) $fileId,
                        resourceName: $file->getFileName(),
                        isDirectory: $file->getIsDirectory(),
                        conflict: new RestoreConflictDTO(
                            type: RestoreConflictType::ParentMissing,
                            originalParentId: $parentId,
                        ),
                    );
                    continue;
                }
            }

            // Step 2: detect name_conflict (only when parent is healthy)
            $existing = $this->taskFileRepository->getByProjectParentAndName(
                $file->getProjectId(),
                $parentId,
                $file->getFileName()
            );

            if ($existing !== null && $existing->getFileId() !== $file->getFileId()) {
                $itemsWithConflict[] = new RestorePreviewItemDTO(
                    resourceId: (string) $fileId,
                    resourceName: $file->getFileName(),
                    isDirectory: $file->getIsDirectory(),
                    conflict: new RestoreConflictDTO(
                        type: RestoreConflictType::NameConflict,
                        existingFileId: $existing->getFileId(),
                        existingIsDirectory: $existing->getIsDirectory(),
                    ),
                );
                continue;
            }

            $itemsNoConflict[] = new RestorePreviewItemDTO(
                resourceId: (string) $fileId,
                resourceName: $file->getFileName(),
                isDirectory: $file->getIsDirectory(),
            );
        }

        return [
            'items_with_conflict' => $itemsWithConflict,
            'items_no_conflict' => $itemsNoConflict,
        ];
    }

    /**
     * Restore project and its sub-resources without parent check (no recycle bin record deletion).
     */
    public function restoreProjectWithoutParentCheck(int $projectId, string $userId): void
    {
        $restored = $this->projectRepository->restore($projectId, $userId);
        if (! $restored) {
            throw new RuntimeException(trans('recycle_bin.restore.project_failed'));
        }

        $restoredMembers = $this->projectMemberRepository->restoreByProjectIds([$projectId], $userId);
        $this->logger->info('Restored project members', [
            'project_id' => $projectId,
            'member_count' => $restoredMembers,
        ]);

        $excludeTopicIds = $this->recycleBinRepository->findResourceIdsByParent(
            $projectId,
            RecycleBinResourceType::Topic
        );

        $restoredTopics = $this->topicRepository->restoreByProjectId($projectId, $excludeTopicIds, $userId);
        $this->logger->info('Restored topics under project', [
            'project_id' => $projectId,
            'restored_count' => $restoredTopics,
            'excluded_count' => count($excludeTopicIds),
        ]);
    }

    /**
     * Restore topic without parent check (no recycle bin record deletion).
     */
    public function restoreTopicWithoutParentCheck(int $topicId, string $userId): void
    {
        $restored = $this->topicRepository->restore($topicId, $userId);
        if (! $restored) {
            throw new RuntimeException(trans('recycle_bin.restore.topic_failed'));
        }

        $this->logger->info('Topic restored', ['topic_id' => $topicId, 'user_id' => $userId]);
    }

    /**
     * Find project by ID including soft-deleted records.
     */
    public function findProjectByIdWithTrashed(int $projectId): ?ProjectEntity
    {
        return $this->projectRepository->findByIdWithTrashed($projectId);
    }

    /**
     * Find topic by ID including soft-deleted records.
     */
    public function findTopicByIdWithTrashed(int $topicId): ?TopicEntity
    {
        return $this->topicRepository->findByIdWithTrashed($topicId);
    }

    /**
     * @param array<string, array<string, string>> $conflictResolutions
     */
    private function restoreSingle(
        RecycleBinEntity $entity,
        string $userId,
        array $conflictResolutions = []
    ): void {
        $resourceType = $entity->getResourceType();

        match ($resourceType) {
            RecycleBinResourceType::Workspace => $this->restoreWorkspace($entity, $userId),
            RecycleBinResourceType::Project => $this->restoreProject($entity, $userId),
            RecycleBinResourceType::Topic => $this->restoreTopic($entity, $userId),
            RecycleBinResourceType::File => $this->restoreFile($entity, $userId, $conflictResolutions),
            default => throw new RuntimeException(
                trans('recycle_bin.restore.unsupported_resource_type', ['type' => $resourceType->value])
            ),
        };
    }

    private function restoreWorkspace(RecycleBinEntity $entity, string $userId): void
    {
        $workspaceId = (int) $entity->getResourceId();

        Db::beginTransaction();
        try {
            $restored = $this->workspaceRepository->restore($workspaceId, $userId);
            if (! $restored) {
                throw new RuntimeException(trans('recycle_bin.restore.workspace_not_found_or_permanently_deleted'));
            }

            $excludeProjectIds = $this->recycleBinRepository->findResourceIdsByParent(
                $workspaceId,
                RecycleBinResourceType::Project
            );

            $restoredProjects = $this->projectRepository->restoreByWorkspaceId(
                $workspaceId,
                $excludeProjectIds,
                $userId
            );

            $this->logger->info('Restored projects under workspace', [
                'workspace_id' => $workspaceId,
                'restored_count' => $restoredProjects,
                'excluded_count' => count($excludeProjectIds),
            ]);

            $restoredProjectIds = $this->projectRepository->findProjectIdsByWorkspaceId(
                $workspaceId,
                $excludeProjectIds
            );

            $excludeTopicIds = $this->recycleBinRepository->findResourceIdsByParents(
                $restoredProjectIds,
                RecycleBinResourceType::Topic
            );

            $restoredTopics = $this->topicRepository->restoreByWorkspaceId(
                $workspaceId,
                $restoredProjectIds,
                $excludeTopicIds,
                $userId
            );

            $this->logger->info('Restored topics under workspace', [
                'workspace_id' => $workspaceId,
                'restored_count' => $restoredTopics,
                'excluded_count' => count($excludeTopicIds),
            ]);

            $this->recycleBinRepository->deleteById($entity->getId());

            Db::commit();
        } catch (Throwable $e) {
            Db::rollBack();
            $this->logger->error('Failed to restore workspace', [
                'workspace_id' => $workspaceId,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    private function restoreProject(RecycleBinEntity $entity, string $userId): void
    {
        $projectId = (int) $entity->getResourceId();

        Db::transaction(function () use ($projectId, $entity, $userId) {
            $project = $this->projectRepository->findByIdWithTrashed($projectId);
            if (! $project) {
                throw new RuntimeException(trans('recycle_bin.restore.project_not_found_or_permanently_deleted'));
            }

            $workspaceId = $project->getWorkspaceId();
            if ($workspaceId !== null) {
                $workspaceExists = $this->workspaceRepository->existsAndNotDeleted($workspaceId);
                if (! $workspaceExists) {
                    throw new RuntimeException(trans('recycle_bin.restore.parent_workspace_missing'));
                }
            } else {
                $this->logger->warning('workspace_id is null when restoring project', [
                    'project_id' => $projectId,
                    'recycle_bin_id' => $entity->getId(),
                ]);
            }

            $this->restoreProjectWithoutParentCheck($projectId, $userId);
            $this->recycleBinRepository->deleteById($entity->getId());
        });
    }

    private function restoreTopic(RecycleBinEntity $entity, string $userId): void
    {
        $topicId = (int) $entity->getResourceId();

        Db::transaction(function () use ($topicId, $entity, $userId) {
            $topic = $this->topicRepository->findByIdWithTrashed($topicId);
            if (! $topic) {
                throw new RuntimeException(trans('recycle_bin.restore.topic_not_found_or_permanently_deleted'));
            }

            $parentId = $entity->getParentId();
            if ($parentId !== null) {
                $parentExists = $this->projectRepository->existsAndNotDeleted($parentId);
                if (! $parentExists) {
                    throw new RuntimeException(trans('recycle_bin.restore.parent_project_missing'));
                }
            } else {
                $this->logger->warning('parent_id is null when restoring topic', [
                    'topic_id' => $topicId,
                    'recycle_bin_id' => $entity->getId(),
                ]);
            }

            $this->restoreTopicWithoutParentCheck($topicId, $userId);
            $this->recycleBinRepository->deleteById($entity->getId());
        });
    }

    /**
     * Restore a file or directory.
     *
     * Checks parent_missing then name_conflict in order.
     * Any unresolved conflict (missing or 'skip' strategy) throws, causing the item to be failed.
     *
     * @param array<string, array<string, string>> $conflictResolutions
     */
    private function restoreFile(
        RecycleBinEntity $entity,
        string $userId,
        array $conflictResolutions = []
    ): void {
        $fileId = (int) $entity->getResourceId();
        $resolution = $conflictResolutions[(string) $fileId] ?? [];

        Db::transaction(function () use ($fileId, $entity, $userId, $resolution) {
            // 1. Validate recycle bin record state
            if ($entity->getRemovedAt() !== null || $entity->getPurgedAt() !== null) {
                throw new RuntimeException(trans('recycle_bin.restore.file_removed_cannot_restore'));
            }

            // 2. Load file (including soft-deleted)
            $file = $this->taskFileRepository->getByIdWithTrash($fileId);
            if ($file === null) {
                throw new RuntimeException(trans('recycle_bin.restore.file_not_found_or_permanently_deleted'));
            }

            // 3. Already restored — just clean up recycle bin record
            if ($file->getDeletedAt() === null) {
                $this->recycleBinRepository->deleteById($entity->getId());
                return;
            }

            // 4. Resolve target parent (use file.parent_id directly, no extra_data)
            $targetParentId = $this->resolveTargetParentId($file->getParentId(), $file->getProjectId(), $resolution);

            // 5. Check name conflict at resolved target location
            $existing = $this->taskFileRepository->getByProjectParentAndName(
                $file->getProjectId(),
                $targetParentId,
                $file->getFileName()
            );

            if ($existing !== null && $existing->getFileId() !== $file->getFileId()) {
                $nameResolution = RestoreConflictResolution::tryFrom($resolution['name_conflict'] ?? '');

                if ($nameResolution === RestoreConflictResolution::Overwrite) {
                    // Soft-delete the conflicting entry (self only, no recursive)
                    $this->taskFileRepository->deleteById($existing->getFileId(), false);
                    $this->logger->info('Overwrote conflicting file during restore', [
                        'existing_file_id' => $existing->getFileId(),
                        'restore_file_id' => $fileId,
                    ]);
                } else {
                    throw new RuntimeException(trans('recycle_bin.restore.file_name_conflict'));
                }
            }

            // 6. Restore the file record
            $this->taskFileRepository->restoreFile($fileId);
            $restored = $this->taskFileRepository->getById($fileId);
            if ($restored === null) {
                throw new RuntimeException(trans('recycle_bin.restore.file_failed'));
            }

            // 7. Update parent and timestamp
            $restored->setParentId($targetParentId);
            $restored->setFileName($file->getFileName());
            $restored->setFileExtension(
                $restored->getIsDirectory() ? '' : (pathinfo($file->getFileName(), PATHINFO_EXTENSION) ?: '')
            );
            $restored->setDeletedAt(null);
            $restored->setUpdatedAt(date('Y-m-d H:i:s'));
            $this->taskFileRepository->updateById($restored);

            // 8. Bump parent metadata version
            if ($targetParentId !== null && $targetParentId > 0) {
                $this->taskFileRepository->incrementMetadataVersionByIds([$targetParentId]);
            }

            $this->logger->info('File restored successfully', [
                'file_id' => $fileId,
                'target_parent_id' => $targetParentId,
                'user_id' => $userId,
            ]);

            // 9. Remove recycle bin record
            $this->recycleBinRepository->deleteById($entity->getId());
        });
    }

    /**
     * Resolve the effective target parent ID.
     * Uses file.parent_id directly. On parent_missing, applies resolution strategy.
     *
     * @param array<string, string> $resolution
     * @throws RuntimeException when parent is missing and no valid resolution is given
     */
    private function resolveTargetParentId(?int $parentId, int $projectId, array $resolution): ?int
    {
        // Root-level file — no parent check needed
        if ($parentId === null || $parentId <= 0) {
            return null;
        }

        $parent = $this->taskFileRepository->getByIdWithTrash($parentId);
        $parentMissing = $parent === null || $parent->getDeletedAt() !== null || ! $parent->getIsDirectory();

        if (! $parentMissing) {
            return $parentId;
        }

        // Parent is missing — apply resolution
        $parentResolution = RestoreConflictResolution::tryFrom($resolution['parent_missing'] ?? '');

        if ($parentResolution === RestoreConflictResolution::RestoreToRoot) {
            $root = $this->taskFileRepository->findRootDirectoryByProjectId($projectId);
            if ($root === null) {
                throw new RuntimeException(trans('recycle_bin.restore.file_restore_to_root_failed'));
            }
            return $root->getFileId();
        }

        throw new RuntimeException(trans('recycle_bin.restore.file_parent_missing'));
    }
}
