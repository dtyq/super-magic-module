<?php

declare(strict_types=1);

namespace Dtyq\SuperMagic\Domain\SuperAgent\Repository\Facade;

use Dtyq\SuperMagic\Domain\SuperAgent\Entity\WorkspaceVersionEntity;

interface WorkspaceVersionRepositoryInterface
{
    public function create(WorkspaceVersionEntity $entity): WorkspaceVersionEntity;
    public function findById(int $id): ?WorkspaceVersionEntity;
    public function findByTopicId(int $topicId): array;
}
