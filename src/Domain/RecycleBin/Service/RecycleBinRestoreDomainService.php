<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Domain\RecycleBin\Service;

use Dtyq\SuperMagic\Domain\RecycleBin\Entity\RecycleBinEntity;
use Dtyq\SuperMagic\Domain\RecycleBin\Enum\RecycleBinResourceType;
use Dtyq\SuperMagic\Domain\RecycleBin\Repository\Facade\RecycleBinRepositoryInterface;
use Dtyq\SuperMagic\Domain\SuperAgent\Entity\ProjectEntity;
use Dtyq\SuperMagic\Domain\SuperAgent\Entity\TaskFileEntity;
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
 * 回收站恢复领域服务.
 *
 * 负责工作区、项目、话题的恢复逻辑（含级联恢复）.
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
     * 批量恢复资源（允许部分成功）.
     *
     * @param array $resourceIds 资源ID数组
     * @param RecycleBinResourceType $resourceType 资源类型枚举
     * @param string $userId 当前用户ID
     * @return array ['succeeded' => RecycleBinEntity[], 'failed' => ['entity' => RecycleBinEntity, 'error' => string][]]
     */
    public function restoreBatch(
        array $resourceIds,
        RecycleBinResourceType $resourceType,
        string $userId
    ): array {
        $entities = $this->recycleBinRepository->findLatestByResourceIds($resourceIds, $resourceType, $userId);

        if (empty($entities)) {
            return ['succeeded' => [], 'failed' => []];
        }

        $succeeded = [];
        $failed = [];

        foreach ($entities as $entity) {
            try {
                $this->restoreSingle($entity, $userId);
                $succeeded[] = $entity;
            } catch (Throwable $e) {
                $this->logger->error('恢复资源失败', [
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

        return [
            'succeeded' => $succeeded,
            'failed' => $failed,
        ];
    }

    /**
     * 恢复项目及其子资源（不验证父级，不删除回收站记录）.
     *
     * @param int $projectId 项目ID
     * @param string $userId 当前用户ID
     * @throws RuntimeException
     */
    public function restoreProjectWithoutParentCheck(int $projectId, string $userId): void
    {
        $restored = $this->projectRepository->restore($projectId, $userId);
        if (! $restored) {
            throw new RuntimeException(trans('recycle_bin.restore.project_failed'));
        }

        $restoredMembers = $this->projectMemberRepository->restoreByProjectIds(
            [$projectId],
            $userId
        );

        $this->logger->info('恢复项目成员', [
            'project_id' => $projectId,
            'member_count' => $restoredMembers,
        ]);

        // 查询用户曾单独删除的话题，恢复时排除
        $excludeTopicIds = $this->recycleBinRepository->findResourceIdsByParent(
            $projectId,
            RecycleBinResourceType::Topic
        );

        $restoredTopics = $this->topicRepository->restoreByProjectId(
            $projectId,
            $excludeTopicIds,
            $userId
        );

        $this->logger->info('恢复项目下的话题', [
            'project_id' => $projectId,
            'restored_count' => $restoredTopics,
            'excluded_count' => count($excludeTopicIds),
        ]);
    }

    /**
     * 恢复话题（不验证父级，不删除回收站记录）.
     *
     * @param int $topicId 话题ID
     * @param string $userId 当前用户ID
     * @throws RuntimeException
     */
    public function restoreTopicWithoutParentCheck(int $topicId, string $userId): void
    {
        $restored = $this->topicRepository->restore($topicId, $userId);
        if (! $restored) {
            throw new RuntimeException(trans('recycle_bin.restore.topic_failed'));
        }

        $this->logger->info('恢复话题成功', [
            'topic_id' => $topicId,
            'user_id' => $userId,
        ]);
    }

    /**
     * 根据ID查询项目（包含软删除的项目）.
     *
     * @param int $projectId 项目ID
     * @return null|ProjectEntity 项目实体或null
     */
    public function findProjectByIdWithTrashed(int $projectId): ?ProjectEntity
    {
        return $this->projectRepository->findByIdWithTrashed($projectId);
    }

    /**
     * 根据ID查询话题（包含软删除的话题）.
     *
     * @param int $topicId 话题ID
     * @return null|TopicEntity 话题实体或null
     */
    public function findTopicByIdWithTrashed(int $topicId): ?TopicEntity
    {
        return $this->topicRepository->findByIdWithTrashed($topicId);
    }

    /**
     * 恢复单个资源.
     *
     * @param RecycleBinEntity $entity 回收站实体
     * @param string $userId 当前用户ID
     * @throws RuntimeException 当恢复失败时抛出
     */
    private function restoreSingle(RecycleBinEntity $entity, string $userId): void
    {
        $resourceType = $entity->getResourceType();

        match ($resourceType) {
            RecycleBinResourceType::Workspace => $this->restoreWorkspace($entity, $userId),
            RecycleBinResourceType::Project => $this->restoreProject($entity, $userId),
            RecycleBinResourceType::Topic => $this->restoreTopic($entity, $userId),
            RecycleBinResourceType::File => $this->restoreFile($entity, $userId),
            default => throw new RuntimeException(trans('recycle_bin.restore.unsupported_resource_type', ['type' => $resourceType->value])),
        };
    }

    /**
     * 恢复工作区（级联恢复项目、话题）.
     */
    private function restoreWorkspace(RecycleBinEntity $entity, string $userId): void
    {
        $workspaceId = (int) $entity->getResourceId();

        Db::beginTransaction();
        try {
            $restored = $this->workspaceRepository->restore($workspaceId, $userId);
            if (! $restored) {
                throw new RuntimeException(trans('recycle_bin.restore.workspace_not_found_or_permanently_deleted'));
            }

            // 查询用户曾单独删除的项目，恢复时排除
            $excludeProjectIds = $this->recycleBinRepository->findResourceIdsByParent(
                $workspaceId,
                RecycleBinResourceType::Project
            );

            $restoredProjects = $this->projectRepository->restoreByWorkspaceId(
                $workspaceId,
                $excludeProjectIds,
                $userId
            );

            $this->logger->info('恢复工作区下的项目', [
                'workspace_id' => $workspaceId,
                'restored_count' => $restoredProjects,
                'excluded_count' => count($excludeProjectIds),
            ]);

            // 查询用户曾单独删除的话题，恢复时排除
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

            $this->logger->info('恢复工作区下的话题', [
                'workspace_id' => $workspaceId,
                'restored_count' => $restoredTopics,
                'excluded_count' => count($excludeTopicIds),
            ]);

            $this->recycleBinRepository->deleteById($entity->getId());

            Db::commit();
        } catch (Throwable $e) {
            Db::rollBack();
            $this->logger->error('恢复工作区失败', [
                'workspace_id' => $workspaceId,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * 恢复项目（级联恢复话题、成员，排除用户曾删的话题）.
     *
     * @param RecycleBinEntity $entity 回收站实体
     * @param string $userId 当前用户ID
     * @throws RuntimeException 恢复失败时抛出异常
     */
    private function restoreProject(RecycleBinEntity $entity, string $userId): void
    {
        $projectId = (int) $entity->getResourceId();

        Db::transaction(function () use ($projectId, $entity, $userId) {
            $project = $this->projectRepository->findByIdWithTrashed($projectId);
            if (! $project) {
                throw new RuntimeException(trans('recycle_bin.restore.project_not_found_or_permanently_deleted'));
            }

            // 验证父级工作区是否存在
            $workspaceId = $project->getWorkspaceId();
            if ($workspaceId !== null) {
                $workspaceExists = $this->workspaceRepository->existsAndNotDeleted($workspaceId);
                if (! $workspaceExists) {
                    throw new RuntimeException(trans('recycle_bin.restore.parent_workspace_missing'));
                }
            } else {
                $this->logger->warning('恢复项目时 workspace_id 为空', [
                    'project_id' => $projectId,
                    'recycle_bin_id' => $entity->getId(),
                ]);
            }

            $this->restoreProjectWithoutParentCheck($projectId, $userId);
            $this->recycleBinRepository->deleteById($entity->getId());
        });
    }

    /**
     * 恢复话题（单独恢复）.
     *
     * @param RecycleBinEntity $entity 回收站实体
     * @param string $userId 当前用户ID
     * @throws RuntimeException 恢复失败时抛出异常
     */
    private function restoreTopic(RecycleBinEntity $entity, string $userId): void
    {
        $topicId = (int) $entity->getResourceId();

        Db::transaction(function () use ($topicId, $entity, $userId) {
            $topic = $this->topicRepository->findByIdWithTrashed($topicId);
            if (! $topic) {
                throw new RuntimeException(trans('recycle_bin.restore.topic_not_found_or_permanently_deleted'));
            }

            // 验证父级项目是否存在
            $parentId = $entity->getParentId();
            if ($parentId !== null) {
                $parentExists = $this->projectRepository->existsAndNotDeleted($parentId);
                if (! $parentExists) {
                    throw new RuntimeException(trans('recycle_bin.restore.parent_project_missing'));
                }
            } else {
                $this->logger->warning('恢复话题时 parent_id 为空', [
                    'topic_id' => $topicId,
                    'recycle_bin_id' => $entity->getId(),
                ]);
            }

            $this->restoreTopicWithoutParentCheck($topicId, $userId);
            $this->recycleBinRepository->deleteById($entity->getId());
        });
    }

    /**
     * 恢复文件或目录（目录只恢复自身，子级依赖父级恢复后重新可见）.
     */
    private function restoreFile(RecycleBinEntity $entity, string $userId): void
    {
        $fileId = (int) $entity->getResourceId();

        Db::transaction(function () use ($fileId, $entity, $userId) {
            if ($entity->getRemovedAt() !== null || $entity->getPurgedAt() !== null) {
                throw new RuntimeException(trans('recycle_bin.restore.file_removed_cannot_restore'));
            }

            $file = $this->taskFileRepository->getByIdWithTrash($fileId);
            if ($file === null) {
                throw new RuntimeException(trans('recycle_bin.restore.file_not_found_or_permanently_deleted'));
            }

            if ($file->getDeletedAt() === null) {
                $this->recycleBinRepository->deleteById($entity->getId());
                return;
            }

            $targetParentId = $this->resolveRestoreParentId($entity, $file);
            $targetName = $this->resolveRestoreFileName($file, $targetParentId);

            $this->taskFileRepository->restoreFile($fileId);
            $restored = $this->taskFileRepository->getById($fileId);
            if ($restored === null) {
                throw new RuntimeException(trans('recycle_bin.restore.file_failed'));
            }

            $restored->setParentId($targetParentId);
            $restored->setFileName($targetName);
            $restored->setFileExtension($restored->getIsDirectory() ? '' : (pathinfo($targetName, PATHINFO_EXTENSION) ?: ''));
            $restored->setDeletedAt(null);
            $restored->setUpdatedAt(date('Y-m-d H:i:s'));
            $this->taskFileRepository->updateById($restored);

            if ($targetParentId !== null && $targetParentId > 0) {
                $this->taskFileRepository->incrementMetadataVersionByIds([$targetParentId]);
            }

            $this->logger->info('恢复文件成功', [
                'file_id' => $fileId,
                'target_parent_id' => $targetParentId,
                'target_name' => $targetName,
                'user_id' => $userId,
            ]);

            $this->recycleBinRepository->deleteById($entity->getId());
        });
    }

    private function resolveRestoreParentId(RecycleBinEntity $entity, TaskFileEntity $file): ?int
    {
        $extraData = $entity->getExtraData() ?? [];
        $targetParentId = array_key_exists('original_parent_id', $extraData)
            ? ($extraData['original_parent_id'] === null ? null : (int) $extraData['original_parent_id'])
            : $file->getParentId();

        if ($targetParentId !== null && $targetParentId > 0) {
            $parent = $this->taskFileRepository->getById($targetParentId);
            if ($parent === null || ! $parent->getIsDirectory()) {
                throw new RuntimeException(trans('recycle_bin.restore.parent_directory_missing'));
            }
        }

        return $targetParentId;
    }

    private function resolveRestoreFileName(TaskFileEntity $file, ?int $targetParentId): string
    {
        $targetName = $file->getFileName();
        $existing = $this->taskFileRepository->getByProjectParentAndName(
            $file->getProjectId(),
            $targetParentId,
            $targetName
        );

        if ($existing === null || $existing->getFileId() === $file->getFileId()) {
            return $targetName;
        }

        return $this->generateUniqueFileNameInParent(
            $file->getProjectId(),
            $targetParentId ?? 0,
            $targetName,
            $file->getIsDirectory()
        );
    }

    private function generateUniqueFileNameInParent(
        int $projectId,
        int $parentId,
        string $originalFileName,
        bool $isDirectory
    ): string {
        $siblings = $this->taskFileRepository->getChildrenByParentAndProject($projectId, $parentId, 10000);

        $existingNames = [];
        foreach ($siblings as $sibling) {
            $existingNames[$sibling->getFileName()] = true;
        }

        if (! isset($existingNames[$originalFileName])) {
            return $originalFileName;
        }

        if ($isDirectory) {
            for ($i = 1; $i <= 20; ++$i) {
                $candidate = $originalFileName . '(' . $i . ')';
                if (! isset($existingNames[$candidate])) {
                    return $candidate;
                }
            }

            return $originalFileName . '_' . time() . substr((string) microtime(true), -6);
        }

        $pathInfo = pathinfo($originalFileName);
        $baseName = $pathInfo['filename'] ?? $originalFileName;
        $extension = isset($pathInfo['extension']) ? '.' . $pathInfo['extension'] : '';

        for ($i = 1; $i <= 20; ++$i) {
            $candidate = $baseName . '(' . $i . ')' . $extension;
            if (! isset($existingNames[$candidate])) {
                return $candidate;
            }
        }

        return $baseName . '_' . time() . substr((string) microtime(true), -6) . $extension;
    }
}
