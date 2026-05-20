<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Application\RecycleBin\Service;

use Dtyq\SuperMagic\Domain\RecycleBin\Enum\RecycleBinResourceType;
use Dtyq\SuperMagic\Domain\RecycleBin\Service\RecycleBinDomainService;
use Dtyq\SuperMagic\Domain\SuperAgent\Entity\TaskFileEntity;
use Dtyq\SuperMagic\Domain\SuperAgent\Event\DeleteEventSource;
use Dtyq\SuperMagic\Domain\SuperAgent\Event\DirectoryDeletedEvent;
use Dtyq\SuperMagic\Domain\SuperAgent\Event\FileDeletedEvent;
use Dtyq\SuperMagic\Domain\SuperAgent\Event\FilesBatchDeletedEvent;
use Dtyq\SuperMagic\Domain\SuperAgent\Service\ProjectDomainService;
use Dtyq\SuperMagic\Domain\SuperAgent\Service\TaskFileDomainService;
use Dtyq\SuperMagic\Domain\SuperAgent\Service\WorkspaceDomainService;
use Hyperf\Event\Annotation\Listener;
use Hyperf\Event\Contract\ListenerInterface;
use Hyperf\Logger\LoggerFactory;
use Psr\Log\LoggerInterface;
use Throwable;

/**
 * 文件/目录删除后写入统一回收站.
 */
#[Listener]
class FileRecycleBinSubscriber implements ListenerInterface
{
    private readonly LoggerInterface $logger;

    public function __construct(
        private readonly RecycleBinDomainService $recycleBinDomainService,
        private readonly TaskFileDomainService $taskFileDomainService,
        private readonly ProjectDomainService $projectDomainService,
        private readonly WorkspaceDomainService $workspaceDomainService,
        LoggerFactory $loggerFactory
    ) {
        $this->logger = $loggerFactory->get(self::class);
    }

    public function listen(): array
    {
        return [
            FileDeletedEvent::class,
            DirectoryDeletedEvent::class,
            FilesBatchDeletedEvent::class,
        ];
    }

    public function process(object $event): void
    {
        try {
            match (true) {
                $event instanceof FileDeletedEvent => $this->handleFileDeleted($event),
                $event instanceof DirectoryDeletedEvent => $this->handleDirectoryDeleted($event),
                $event instanceof FilesBatchDeletedEvent => $this->handleFilesBatchDeleted($event),
                default => null,
            };
        } catch (Throwable $e) {
            $this->logger->error('写入文件回收站失败', [
                'event' => $event::class,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }

    private function handleFileDeleted(FileDeletedEvent $event): void
    {
        if (! $this->shouldRecordSource($event->getSource())) {
            return;
        }

        $this->recordFileDeletion(
            $event->getFileEntity(),
            $event->getUserId(),
            $event->getSource()
        );
    }

    private function handleDirectoryDeleted(DirectoryDeletedEvent $event): void
    {
        if (! $this->shouldRecordSource($event->getSource())) {
            return;
        }

        $this->recordFileDeletion(
            $event->getDirectoryEntity(),
            $event->getUserAuthorization()->getId(),
            $event->getSource()
        );
    }

    private function handleFilesBatchDeleted(FilesBatchDeletedEvent $event): void
    {
        if (! $this->shouldRecordSource($event->getSource())) {
            return;
        }

        foreach ($event->getAllEntities() as $fileEntity) {
            $this->recordFileDeletion(
                $fileEntity,
                $event->getUserId(),
                $event->getSource()
            );
        }
    }

    private function shouldRecordSource(DeleteEventSource $source): bool
    {
        return in_array($source, [DeleteEventSource::User, DeleteEventSource::Agent], true);
    }

    private function recordFileDeletion(TaskFileEntity $fileEntity, string $deletedBy, DeleteEventSource $source): void
    {
        $fileId = (int) $fileEntity->getFileId();
        if ($fileId <= 0) {
            return;
        }

        $existing = $this->recycleBinDomainService->findByResource(RecycleBinResourceType::File, $fileId);
        if ($existing !== null) {
            return;
        }

        $project = $this->projectDomainService->getProjectNotUserId($fileEntity->getProjectId());
        $workspace = null;
        if ($project !== null && $project->getWorkspaceId() !== null) {
            $workspace = $this->workspaceDomainService->getWorkspaceDetail($project->getWorkspaceId());
        }

        $originalParentId = $fileEntity->getParentId();
        $originalParentName = '';
        if ($originalParentId !== null && $originalParentId > 0) {
            $parent = $this->taskFileDomainService->getById($originalParentId);
            $originalParentName = $parent?->getFileName() ?? '';
        }

        $this->recycleBinDomainService->recordDeletion(
            resourceType: RecycleBinResourceType::File,
            resourceId: $fileId,
            resourceName: $fileEntity->getFileName(),
            ownerId: $fileEntity->getUserId(),
            deletedBy: $deletedBy,
            parentId: $fileEntity->getProjectId(),
            extraData: [
                'delete_source' => $source->value,
                'is_directory' => $fileEntity->getIsDirectory(),
                'file_key' => $fileEntity->getFileKey(),
                'storage_type' => $fileEntity->getStorageType()->value,
                'source' => $fileEntity->getSource()->value,
                'original_parent_id' => $originalParentId,
                'original_parent_name' => $originalParentName,
                'project_id' => $fileEntity->getProjectId(),
                'project_name' => $project?->getProjectName() ?? '',
                'workspace_id' => $project?->getWorkspaceId(),
                'workspace_name' => $workspace?->getName() ?? '',
            ]
        );
    }
}
