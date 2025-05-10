<?php

namespace App\Application\KnowledgeBase\Service\Strategy\KnowledgeBase;

use App\Domain\KnowledgeBase\Entity\ValueObject\KnowledgeBaseDataIsolation;

interface KnowledgeBaseStrategyInterface
{
    public function getKnowledgeBaseOperations(KnowledgeBaseDataIsolation $dataIsolation): array;

    public function getQueryKnowledgeTypes(): array;
}