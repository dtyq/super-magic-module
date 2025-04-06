<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\ModelAdmin\Entity;

use Hyperf\Codec\Json;

class ServiceProviderEntity extends AbstractEntity
{
    protected int $id;

    protected string $name = '';

    protected string $remark = '';

    protected string $providerCode = '';

    protected string $description = '';

    protected string $icon = '';

    protected int $providerType;

    protected string $category = '';

    protected int $status;

    protected ?array $translate = [];

    protected bool $isModelsEnable; // 这个值作用是服务商是否可以 获取模型列表 功能，因需求变了，该字段暂时没用了。通过 $category === vlm or === llm 来判断，llm 必须手动添加,vlm 超级管理员添加

    protected string $createdAt;

    protected string $updatedAt;

    protected ?string $deletedAt;

    public function getProviderCode(): string
    {
        return $this->providerCode;
    }

    public function setProviderCode(string $providerCode): void
    {
        $this->providerCode = $providerCode;
    }

    public function getId(): int
    {
        return $this->id;
    }

    public function setId(int|string $id): void
    {
        $this->id = (int) $id;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function getIcon(): ?string
    {
        return $this->icon;
    }

    public function getProviderType(): int
    {
        return $this->providerType;
    }

    public function getCategory(): string
    {
        return $this->category;
    }

    public function getStatus(): int
    {
        return $this->status;
    }

    public function getRemark(): string
    {
        return $this->remark;
    }

    public function setRemark(string $remark): void
    {
        $this->remark = $remark;
    }

    public function getCreatedAt(): string
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): string
    {
        return $this->updatedAt;
    }

    public function getDeletedAt(): ?string
    {
        return $this->deletedAt;
    }

    public function setName(string $name): void
    {
        $this->name = $name;
    }

    public function setDescription(?string $description): void
    {
        $this->description = $description;
    }

    public function setIcon(?string $icon): void
    {
        $this->icon = $icon;
    }

    public function setProviderType(int $providerType): void
    {
        $this->providerType = $providerType;
    }

    public function setCategory(string $category): void
    {
        $this->category = $category;
    }

    public function setStatus(int $status): void
    {
        $this->status = $status;
    }

    public function setCreatedAt(string $createdAt): void
    {
        $this->createdAt = $createdAt;
    }

    public function setUpdatedAt(string $updatedAt): void
    {
        $this->updatedAt = $updatedAt;
    }

    public function setDeletedAt(?string $deletedAt): void
    {
        $this->deletedAt = $deletedAt;
    }

    public function getIsModelsEnable(): bool
    {
        return $this->isModelsEnable;
    }

    public function setIsModelsEnable(bool|int $isModelsEnable): void
    {
        $this->isModelsEnable = (bool) $isModelsEnable;
    }

    public function getTranslate(): ?array
    {
        return $this->translate;
    }

    public function setTranslate(null|array|string $translate): void
    {
        if (is_string($translate)) {
            $translate = Json::decode($translate);
        }
        if (is_null($translate)) {
            $translate = [];
        }
        $this->translate = $translate;
    }

    public function i18n(string $languages)
    {
        if (isset($this->translate['name'][$languages])) {
            $this->name = $this->translate['name'][$languages];
        }
        if (isset($this->translate['description'][$languages])) {
            $this->description = $this->translate['description'][$languages];
        }
    }
}
