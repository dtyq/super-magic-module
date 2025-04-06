<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Interfaces\Flow\DTO\Knowledge;

use App\Domain\KnowledgeBase\Entity\KnowledgeBaseFragmentEntity;
use App\Domain\KnowledgeBase\Entity\ValueObject\KnowledgeSyncStatus;
use App\Interfaces\Flow\DTO\AbstractFlowDTO;

class MagicFlowKnowledgeFragmentDTO extends AbstractFlowDTO
{
    public string $knowledgeCode;

    public string $knowledgeBaseCode;

    public string $documentCode;

    public string $content;

    public array $metadata = [];

    public string $businessId = '';

    public int $syncStatus;

    public string $syncStatusMessage = '';

    public float $score;

    public static function fromEntity(KnowledgeBaseFragmentEntity $entity): MagicFlowKnowledgeFragmentDTO
    {
        $dto = new MagicFlowKnowledgeFragmentDTO($entity->toArray());
        $dto->setKnowledgeBaseCode($entity->getKnowledgeCode());
        unset($dto->knowledgeCode);
        return $dto;
    }

    public function getKnowledgeCode(): string
    {
        return $this->knowledgeCode;
    }

    public function setKnowledgeCode(?string $knowledgeCode): void
    {
        $this->knowledgeCode = $knowledgeCode ?? '';
    }

    public function getKnowledgeBaseCode(): string
    {
        return $this->knowledgeBaseCode;
    }

    public function setKnowledgeBaseCode(string $knowledgeBaseCode): MagicFlowKnowledgeFragmentDTO
    {
        $this->knowledgeBaseCode = $knowledgeBaseCode;
        return $this;
    }

    public function getContent(): string
    {
        return $this->content;
    }

    public function setContent(?string $content): void
    {
        $this->content = $content ?? '';
    }

    public function getMetadata(): array
    {
        return $this->metadata;
    }

    public function setMetadata(?array $metadata): void
    {
        $this->metadata = $metadata ?? [];
    }

    public function getBusinessId(): string
    {
        return $this->businessId;
    }

    public function setBusinessId(?string $businessId): void
    {
        $this->businessId = $businessId ?? '';
    }

    public function getSyncStatus(): int
    {
        return $this->syncStatus;
    }

    public function setSyncStatus(null|int|KnowledgeSyncStatus $syncStatus): void
    {
        $syncStatus instanceof KnowledgeSyncStatus && $syncStatus = $syncStatus->value;
        $this->syncStatus = $syncStatus ?? 0;
    }

    public function getSyncStatusMessage(): string
    {
        return $this->syncStatusMessage;
    }

    public function setSyncStatusMessage(?string $syncStatusMessage): void
    {
        $this->syncStatusMessage = $syncStatusMessage ?? '';
    }

    public function getScore(): float
    {
        return $this->score;
    }

    public function setScore(?float $score): void
    {
        $this->score = $score ?? 0.0;
    }

    public function getDocumentCode(): string
    {
        return $this->documentCode;
    }

    public function setDocumentCode(string $documentCode): MagicFlowKnowledgeFragmentDTO
    {
        $this->documentCode = $documentCode;
        return $this;
    }
}
