<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Domain\RecycleBin\Entity;

use App\Infrastructure\Core\AbstractEntity;
use Dtyq\SuperMagic\Domain\RecycleBin\Enum\RecycleBinResourceType;

/**
 * 回收站实体.
 */
class RecycleBinEntity extends AbstractEntity
{
    protected ?int $id = null;

    protected RecycleBinResourceType $resourceType;

    protected int $resourceId;

    protected string $resourceName = '';

    protected string $ownerId = '';

    protected string $deletedBy = '';

    protected string $deletedAt = '';

    protected int $retainDays = 30;

    protected ?string $removedAt = null;

    protected ?string $removedBy = null;

    protected ?string $purgedAt = null;

    protected ?int $parentId = null;

    protected ?array $extraData = null;

    protected ?string $createdAt = null;

    protected ?string $updatedAt = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function setId(int $id): self
    {
        $this->id = $id;
        return $this;
    }

    public function getResourceType(): RecycleBinResourceType
    {
        return $this->resourceType;
    }

    public function setResourceType(RecycleBinResourceType $resourceType): self
    {
        $this->resourceType = $resourceType;
        return $this;
    }

    public function getResourceId(): int
    {
        return $this->resourceId;
    }

    public function setResourceId(int $resourceId): self
    {
        $this->resourceId = $resourceId;
        return $this;
    }

    public function getResourceName(): string
    {
        return $this->resourceName;
    }

    public function setResourceName(string $resourceName): self
    {
        $this->resourceName = $resourceName;
        return $this;
    }

    public function getOwnerId(): string
    {
        return $this->ownerId;
    }

    public function setOwnerId(string $ownerId): self
    {
        $this->ownerId = $ownerId;
        return $this;
    }

    public function getDeletedBy(): string
    {
        return $this->deletedBy;
    }

    public function setDeletedBy(string $deletedBy): self
    {
        $this->deletedBy = $deletedBy;
        return $this;
    }

    public function getDeletedAt(): string
    {
        return $this->deletedAt;
    }

    public function setDeletedAt(string $deletedAt): self
    {
        $this->deletedAt = $deletedAt;
        return $this;
    }

    public function getRetainDays(): int
    {
        return $this->retainDays;
    }

    public function setRetainDays(int $retainDays): self
    {
        $this->retainDays = $retainDays;
        return $this;
    }

    public function getRemovedAt(): ?string
    {
        return $this->removedAt;
    }

    public function setRemovedAt(?string $removedAt): self
    {
        $this->removedAt = $removedAt;
        return $this;
    }

    public function getRemovedBy(): ?string
    {
        return $this->removedBy;
    }

    public function setRemovedBy(?string $removedBy): self
    {
        $this->removedBy = $removedBy;
        return $this;
    }

    public function getPurgedAt(): ?string
    {
        return $this->purgedAt;
    }

    public function setPurgedAt(?string $purgedAt): self
    {
        $this->purgedAt = $purgedAt;
        return $this;
    }

    public function getParentId(): ?int
    {
        return $this->parentId;
    }

    public function setParentId(?int $parentId): self
    {
        $this->parentId = $parentId;
        return $this;
    }

    public function getExtraData(): ?array
    {
        return $this->extraData;
    }

    public function setExtraData(?array $extraData): self
    {
        $this->extraData = $extraData;
        return $this;
    }

    public function getCreatedAt(): ?string
    {
        return $this->createdAt;
    }

    public function setCreatedAt(?string $createdAt): self
    {
        $this->createdAt = $createdAt;
        return $this;
    }

    public function getUpdatedAt(): ?string
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(?string $updatedAt): self
    {
        $this->updatedAt = $updatedAt;
        return $this;
    }

    /**
     * 转换为数组.
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'resource_type' => $this->resourceType->value,
            'resource_id' => $this->resourceId,
            'resource_name' => $this->resourceName,
            'owner_id' => $this->ownerId,
            'deleted_by' => $this->deletedBy,
            'deleted_at' => $this->deletedAt,
            'retain_days' => $this->retainDays,
            'removed_at' => $this->removedAt,
            'removed_by' => $this->removedBy,
            'purged_at' => $this->purgedAt,
            'parent_id' => $this->parentId,
            'extra_data' => $this->extraData,
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt,
        ];
    }
}
