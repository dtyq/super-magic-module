<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\Provider\Entity\ValueObject;

use App\Infrastructure\Core\AbstractEntity;

class ModelConfigVO extends AbstractEntity
{
    protected ?int $maxTokens = null;

    protected int $vectorSize = 768;

    protected bool $supportFunction = false;

    protected bool $supportEmbedding = false;

    protected bool $supportDeepThink = false;

    protected bool $supportMultiModal = false;

    public function getMaxTokens(): ?int
    {
        return $this->maxTokens;
    }

    public function setMaxTokens(?int $maxTokens): self
    {
        $this->maxTokens = $maxTokens;
        return $this;
    }

    public function getVectorSize(): int
    {
        return $this->vectorSize;
    }

    public function setVectorSize(int $vectorSize): self
    {
        $this->vectorSize = $vectorSize;
        return $this;
    }

    public function isSupportFunction(): bool
    {
        return $this->supportFunction;
    }

    public function setSupportFunction(bool $supportFunction): self
    {
        $this->supportFunction = $supportFunction;
        return $this;
    }

    public function isSupportEmbedding(): bool
    {
        return $this->supportEmbedding;
    }

    public function setSupportEmbedding(bool $supportEmbedding): self
    {
        $this->supportEmbedding = $supportEmbedding;
        return $this;
    }

    public function isSupportDeepThink(): bool
    {
        return $this->supportDeepThink;
    }

    public function setSupportDeepThink(bool $supportDeepThink): self
    {
        $this->supportDeepThink = $supportDeepThink;
        return $this;
    }

    public function isSupportMultiModal(): bool
    {
        return $this->supportMultiModal;
    }

    public function setSupportMultiModal(bool $supportMultiModal): self
    {
        $this->supportMultiModal = $supportMultiModal;
        return $this;
    }
}
