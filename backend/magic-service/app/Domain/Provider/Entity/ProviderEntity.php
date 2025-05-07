<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\Provider\Entity;

use App\Domain\Provider\Entity\ValueObject\Category;
use App\Domain\Provider\Entity\ValueObject\ProviderCode;
use App\Domain\Provider\Entity\ValueObject\ProviderType;
use App\Domain\Provider\Entity\ValueObject\Status;
use App\Infrastructure\Core\AbstractEntity;
use DateTime;

class ProviderEntity extends AbstractEntity
{
    protected ?int $id = null;

    protected string $name;

    protected ProviderCode $providerCode;

    protected string $description = '';

    protected string $icon = '';

    protected ProviderType $providerType;

    protected Category $category;

    protected Status $status;

    protected int $isModelsEnable;

    protected array $translate = [];

    protected string $remark = '';

    protected DateTime $createdAt;

    protected DateTime $updatedAt;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function setId(null|int|string $id): void
    {
        $this->id = $id ? (int) $id : null;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): void
    {
        $this->name = $name;
    }

    public function getProviderCode(): ProviderCode
    {
        return $this->providerCode;
    }

    public function setProviderCode(ProviderCode $providerCode): void
    {
        $this->providerCode = $providerCode;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): void
    {
        $this->description = $description;
    }

    public function getIcon(): ?string
    {
        return $this->icon;
    }

    public function setIcon(?string $icon): void
    {
        $this->icon = $icon;
    }

    public function getProviderType(): ProviderType
    {
        return $this->providerType;
    }

    public function setProviderType(ProviderType $providerType): void
    {
        $this->providerType = $providerType;
    }

    public function getCategory(): Category
    {
        return $this->category;
    }

    public function setCategory(Category $category): void
    {
        $this->category = $category;
    }

    public function getStatus(): Status
    {
        return $this->status;
    }

    public function setStatus(Status $status): void
    {
        $this->status = $status;
    }

    public function getIsModelsEnable(): int
    {
        return $this->isModelsEnable;
    }

    public function setIsModelsEnable(int $isModelsEnable): void
    {
        $this->isModelsEnable = $isModelsEnable;
    }

    public function getTranslate(): ?array
    {
        return $this->translate;
    }

    public function setTranslate(?array $translate): void
    {
        $this->translate = $translate ?? [];
    }

    public function getRemark(): string
    {
        return $this->remark;
    }

    public function setRemark(string $remark): void
    {
        $this->remark = $remark;
    }

    public function getCreatedAt(): DateTime
    {
        return $this->createdAt;
    }

    public function setCreatedAt(DateTime $createdAt): void
    {
        $this->createdAt = $createdAt;
    }

    public function getUpdatedAt(): DateTime
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(DateTime $updatedAt): void
    {
        $this->updatedAt = $updatedAt;
    }
}
