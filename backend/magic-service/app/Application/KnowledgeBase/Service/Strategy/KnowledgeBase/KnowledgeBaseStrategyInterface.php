<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\KnowledgeBase\Service\Strategy\KnowledgeBase;

use App\Domain\KnowledgeBase\Entity\ValueObject\KnowledgeBaseDataIsolation;
use App\Domain\Permission\Entity\ValueObject\OperationPermission\Operation;

interface KnowledgeBaseStrategyInterface
{
    public function getKnowledgeBaseOperations(KnowledgeBaseDataIsolation $dataIsolation): array;

    public function getQueryKnowledgeTypes(): array;

    public function getKnowledgeOperation(KnowledgeBaseDataIsolation $dataIsolation, int|string $knowledgeCode): Operation;
}
