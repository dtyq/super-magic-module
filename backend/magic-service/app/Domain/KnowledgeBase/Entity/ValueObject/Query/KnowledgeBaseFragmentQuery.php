<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\KnowledgeBase\Entity\ValueObject\Query;

use App\Interfaces\KnowledgeBase\DTO\Request\GetFragmentListRequestDTO;

class KnowledgeBaseFragmentQuery extends Query
{
    public string $knowledgeCode = '';

    public string $documentCode = '';

    public ?int $syncStatus = null;

    public array $syncStatuses = [];

    public ?int $maxSyncTimes = null;

    public bool $withTrashed = false;

    public static function fromGetFragmentListRequestDTO(GetFragmentListRequestDTO $dto): KnowledgeBaseFragmentQuery
    {
        $query = new self($dto->toArray());
        $query->setKnowledgeCode($dto->getKnowledgeBaseCode());
        $query->setOrder(['updated_at' => 'desc']);
        return $query;
    }

    public function getKnowledgeCode(): string
    {
        return $this->knowledgeCode;
    }

    public function setKnowledgeCode(string $knowledgeCode): self
    {
        $this->knowledgeCode = $knowledgeCode;
        return $this;
    }

    public function getSyncStatus(): ?int
    {
        return $this->syncStatus;
    }

    public function setSyncStatus(?int $syncStatus): void
    {
        $this->syncStatus = $syncStatus;
    }

    public function getSyncStatuses(): array
    {
        return $this->syncStatuses;
    }

    public function setSyncStatuses(array $syncStatuses): void
    {
        $this->syncStatuses = $syncStatuses;
    }

    public function getMaxSyncTimes(): ?int
    {
        return $this->maxSyncTimes;
    }

    public function setMaxSyncTimes(?int $maxSyncTimes): void
    {
        $this->maxSyncTimes = $maxSyncTimes;
    }

    public function getDocumentCode(): string
    {
        return $this->documentCode;
    }

    public function setDocumentCode(string $documentCode): KnowledgeBaseFragmentQuery
    {
        $this->documentCode = $documentCode;
        return $this;
    }

    public function isWithTrashed(): bool
    {
        return $this->withTrashed;
    }

    public function setWithTrashed(bool $withTrashed): self
    {
        $this->withTrashed = $withTrashed;
        return $this;
    }
}
