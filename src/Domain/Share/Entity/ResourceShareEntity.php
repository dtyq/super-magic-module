<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Domain\Share\Entity;

use App\Infrastructure\Core\AbstractEntity;
use DateTime;
use Dtyq\SuperMagic\Domain\Share\Constant\ResourceType;
use Dtyq\SuperMagic\Domain\Share\Constant\ShareAccessType;

/**
 * 通用资源分享实体.
 */
class ResourceShareEntity extends AbstractEntity
{
    /**
     * @var int 主键ID
     */
    protected int $id = 0;

    /**
     * @var string 资源ID
     */
    protected string $resourceId = '';

    /**
     * @var int 资源类型
     */
    protected int $resourceType = 0;

    /**
     * @var string 资源名称
     */
    protected string $resourceName = '';

    /**
     * @var string 分享代码
     */
    protected string $shareCode = '';

    /**
     * @var int 分享类型
     */
    protected int $shareType = 0;

    /**
     * @var null|string 访问密码（可选）
     */
    protected ?string $password = null;

    /**
     * @var null|string 过期时间（可选）
     */
    protected ?string $expireAt = null;

    /**
     * @var int 查看次数
     */
    protected int $viewCount = 0;

    /**
     * @var string 创建者用户ID
     */
    protected string $createdUid = '';

    /**
     * @var string 更新者用户ID
     */
    protected string $updatedUid = '';

    /**
     * @var string 组织代码
     */
    protected string $organizationCode = '';

    /**
     * @var string 目标IDs（SpecificTarget类型时使用）
     *             格式：[{"type": 1, "id": "123"}, {"type": 2, "id": "456"}]
     *             type: 1-用户，2-部门，3-群组
     */
    protected string $targetIds = '';

    /**
     * @var null|string 创建时间
     */
    protected ?string $createdAt = null;

    /**
     * @var null|string 更新时间
     */
    protected ?string $updatedAt = null;

    /**
     * @var null|string 删除时间
     */
    protected ?string $deletedAt = null;

    /**
     * 构造函数.
     */
    public function __construct(array $data = [])
    {
        // 默认设置
        $this->id = 0; // 设置默认ID为0
        $this->viewCount = 0;
        $this->password = null;
        $this->expireAt = null;
        $this->deletedAt = null;
        $this->targetIds = '[]'; // 存储为JSON字符串

        $this->initProperty($data);
    }

    /**
     * 获取资源类型枚举.
     */
    public function getResourceTypeEnum(): ResourceType
    {
        return ResourceType::from($this->resourceType);
    }

    /**
     * 设置资源类型枚举.
     */
    public function setResourceTypeEnum(ResourceType $resourceType): self
    {
        $this->resourceType = $resourceType->value;
        return $this;
    }

    /**
     * 获取分享类型枚举.
     */
    public function getShareTypeEnum(): ShareAccessType
    {
        return ShareAccessType::from($this->shareType);
    }

    /**
     * 设置分享类型枚举.
     */
    public function setShareTypeEnum(ShareAccessType $shareType): self
    {
        $this->shareType = $shareType->value;
        return $this;
    }

    /**
     * 获取目标ID数组.
     */
    public function getTargetIdsArray(): array
    {
        return json_decode($this->targetIds, true) ?: [];
    }

    /**
     * 设置目标ID数组.
     */
    public function setTargetIdsArray(array $targetIds): self
    {
        $this->targetIds = json_encode($targetIds);
        return $this;
    }

    /**
     * 检查分享是否已过期
     */
    public function isExpired(): bool
    {
        if ($this->expireAt === null) {
            return false;
        }

        $expireDateTime = new DateTime($this->expireAt);
        return $expireDateTime < new DateTime();
    }

    /**
     * 检查分享是否已删除.
     */
    public function isDeleted(): bool
    {
        return $this->deletedAt !== null;
    }

    /**
     * 检查分享是否有效.
     */
    public function isValid(): bool
    {
        return ! $this->isExpired() && ! $this->isDeleted();
    }

    /**
     * 增加查看次数.
     */
    public function incrementViewCount(): void
    {
        ++$this->viewCount;
    }

    /**
     * 验证密码
     */
    public function verifyPassword(string $inputPassword): bool
    {
        if (empty($this->password)) {
            return true;
        }

        // 实际应用中应该使用PasswordHasher进行安全的密码验证
        return $this->password === $inputPassword;
    }

    /**
     * 转换为数组.
     */
    public function toArray(): array
    {
        $result = [
            'id' => $this->id,
            'resource_id' => $this->resourceId,
            'resource_type' => $this->resourceType,
            'resource_name' => $this->resourceName,
            'share_code' => $this->shareCode,
            'share_type' => $this->shareType,
            'password' => $this->password,
            'expire_at' => $this->expireAt,
            'view_count' => $this->viewCount,
            'created_uid' => $this->createdUid,
            'updated_uid' => $this->updatedUid,
            'organization_code' => $this->organizationCode,
            'target_ids' => $this->targetIds,
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt,
            'deleted_at' => $this->deletedAt,
        ];

        // 移除null值
        return array_filter($result, function ($value) {
            return $value !== null;
        });
    }

    // Getters and Setters

    public function getId(): int
    {
        return $this->id;
    }

    public function setId(int $id): self
    {
        $this->id = $id;
        return $this;
    }

    public function getResourceId(): string
    {
        return $this->resourceId;
    }

    public function setResourceId(string $resourceId): self
    {
        $this->resourceId = $resourceId;
        return $this;
    }

    public function getResourceType(): int
    {
        return $this->resourceType;
    }

    public function setResourceType(int $resourceType): self
    {
        $this->resourceType = $resourceType;
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

    public function getShareCode(): string
    {
        return $this->shareCode;
    }

    public function setShareCode(string $shareCode): self
    {
        $this->shareCode = $shareCode;
        return $this;
    }

    public function getShareType(): int
    {
        return $this->shareType;
    }

    public function setShareType(int $shareType): self
    {
        $this->shareType = $shareType;
        return $this;
    }

    public function getPassword(): ?string
    {
        return $this->password;
    }

    public function setPassword(?string $password): self
    {
        $this->password = $password;
        return $this;
    }

    public function getExpireAt(): ?string
    {
        return $this->expireAt;
    }

    public function setExpireAt(?string $expireAt): self
    {
        $this->expireAt = $expireAt;
        return $this;
    }

    public function getViewCount(): int
    {
        return $this->viewCount;
    }

    public function setViewCount(int $viewCount): self
    {
        $this->viewCount = $viewCount;
        return $this;
    }

    public function getCreatedUid(): string
    {
        return $this->createdUid;
    }

    public function setCreatedUid(?string $createdUid): self
    {
        $this->createdUid = $createdUid;
        return $this;
    }

    public function getUpdatedUid(): string
    {
        return $this->updatedUid;
    }

    public function setUpdatedUid(string $updatedUid): self
    {
        $this->updatedUid = $updatedUid;
        return $this;
    }

    public function getOrganizationCode(): string
    {
        return $this->organizationCode;
    }

    public function setOrganizationCode(string $organizationCode): self
    {
        $this->organizationCode = $organizationCode;
        return $this;
    }

    public function getTargetIds(): string
    {
        return $this->targetIds;
    }

    public function setTargetIds(string $targetIds): self
    {
        $this->targetIds = $targetIds;
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

    public function getDeletedAt(): ?string
    {
        return $this->deletedAt;
    }

    public function setDeletedAt(?string $deletedAt): self
    {
        $this->deletedAt = $deletedAt;
        return $this;
    }
}
