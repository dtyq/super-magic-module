<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Domain\SuperAgent\Event;

use Dtyq\SuperMagic\Domain\SuperAgent\Entity\ValueObject\FileMoveChangeSet;

/**
 * Batch move completed with the actual resulting file changes.
 */
class FileBatchMoveCompletedEvent extends AbstractEvent
{
    public function __construct(
        private readonly string $batchKey,
        private readonly string $userId,
        private readonly string $organizationCode,
        private readonly int $targetProjectId,
        private readonly int $sourceProjectId,
        private readonly int $targetParentId,
        private readonly FileMoveChangeSet $changeSet
    ) {
        parent::__construct();
    }

    public function getBatchKey(): string
    {
        return $this->batchKey;
    }

    public function getUserId(): string
    {
        return $this->userId;
    }

    public function getOrganizationCode(): string
    {
        return $this->organizationCode;
    }

    public function getTargetProjectId(): int
    {
        return $this->targetProjectId;
    }

    public function getSourceProjectId(): int
    {
        return $this->sourceProjectId;
    }

    public function getTargetParentId(): int
    {
        return $this->targetParentId;
    }

    public function getChangeSet(): FileMoveChangeSet
    {
        return $this->changeSet;
    }
}
