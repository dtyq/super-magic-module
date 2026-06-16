<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Domain\SuperAgent\Entity\ValueObject;

use Dtyq\SuperMagic\Domain\SuperAgent\Entity\TaskFileEntity;

/**
 * Collected file changes produced by a move operation.
 */
class FileMoveChangeSet
{
    /**
     * @var array<int, TaskFileEntity>
     */
    private array $deletedFileEntities = [];

    /**
     * @var array<int, int>
     */
    private array $addedFileIds = [];

    /**
     * @var array<int, int>
     */
    private array $updatedFileIds = [];

    /**
     * @var array<int, int>
     */
    private array $affectedParentIds = [];

    /**
     * @var array<int, array<int, int>>
     */
    private array $affectedParentIdsByProject = [];

    public function recordDeletedFile(TaskFileEntity $fileEntity): void
    {
        $fileId = $fileEntity->getFileId();
        if ($fileId <= 0) {
            return;
        }

        $this->deletedFileEntities[$fileId] = $fileEntity;
        unset($this->addedFileIds[$fileId], $this->updatedFileIds[$fileId]);
        $this->recordAffectedParentId($fileEntity->getParentId(), $fileEntity->getProjectId());
    }

    public function recordAddedFileId(int $fileId): void
    {
        if ($fileId <= 0 || isset($this->deletedFileEntities[$fileId])) {
            return;
        }

        $this->addedFileIds[$fileId] = $fileId;
        unset($this->updatedFileIds[$fileId]);
    }

    public function recordUpdatedFileId(int $fileId): void
    {
        if ($fileId <= 0 || isset($this->deletedFileEntities[$fileId]) || isset($this->addedFileIds[$fileId])) {
            return;
        }

        $this->updatedFileIds[$fileId] = $fileId;
    }

    public function recordAffectedParentId(?int $parentId, ?int $projectId = null): void
    {
        if ($parentId === null || $parentId <= 0) {
            return;
        }

        $this->affectedParentIds[$parentId] = $parentId;
        if ($projectId !== null && $projectId > 0) {
            $this->affectedParentIdsByProject[$projectId][$parentId] = $parentId;
        }
    }

    public function merge(self $changeSet): void
    {
        foreach ($changeSet->getDeletedFileEntities() as $fileEntity) {
            $this->recordDeletedFile($fileEntity);
        }
        foreach ($changeSet->getAddedFileIds() as $fileId) {
            $this->recordAddedFileId($fileId);
        }
        foreach ($changeSet->getUpdatedFileIds() as $fileId) {
            $this->recordUpdatedFileId($fileId);
        }
        foreach ($changeSet->getAffectedParentIds() as $parentId) {
            $this->recordAffectedParentId($parentId);
        }
    }

    /**
     * @return array<int, TaskFileEntity>
     */
    public function getDeletedFileEntities(): array
    {
        return $this->deletedFileEntities;
    }

    /**
     * @return int[]
     */
    public function getAddedFileIds(): array
    {
        return array_values($this->addedFileIds);
    }

    /**
     * @return int[]
     */
    public function getUpdatedFileIds(): array
    {
        return array_values($this->updatedFileIds);
    }

    /**
     * @return int[]
     */
    public function getAffectedParentIds(): array
    {
        return array_values($this->affectedParentIds);
    }

    /**
     * @return int[]
     */
    public function getAffectedParentIdsForProject(int $projectId): array
    {
        if ($projectId <= 0) {
            return [];
        }

        if (! empty($this->affectedParentIdsByProject[$projectId])) {
            return array_values($this->affectedParentIdsByProject[$projectId]);
        }

        return empty($this->affectedParentIdsByProject) ? $this->getAffectedParentIds() : [];
    }

    public function isEmpty(): bool
    {
        return empty($this->deletedFileEntities)
            && empty($this->addedFileIds)
            && empty($this->updatedFileIds)
            && empty($this->affectedParentIds);
    }
}
