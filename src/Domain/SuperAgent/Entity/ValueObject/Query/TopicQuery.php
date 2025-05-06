<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Domain\SuperAgent\Entity\ValueObject\Query;

/**
 * 话题查询值对象，封装查询条件.
 */
class TopicQuery
{
    /**
     * @var null|string 话题ID
     */
    private ?string $topicId = null;

    /**
     * @var null|string 话题名称
     */
    private ?string $topicName = null;

    /**
     * @var null|string 话题状态
     */
    private ?string $topicStatus = null;

    /**
     * @var null|string 沙盒ID
     */
    private ?string $sandboxId = null;

    /**
     * @var null|string 组织机构代码
     */
    private ?string $organizationCode = null;

    /**
     * @var null|array 用户ID列表，用于按用户ID过滤
     */
    private ?array $userIds = null;

    /**
     * @var int 页码
     */
    private int $page = 1;

    /**
     * @var int 每页条数
     */
    private int $pageSize = 20;

    /**
     * 获取话题ID.
     */
    public function getTopicId(): ?string
    {
        return $this->topicId;
    }

    /**
     * 设置话题ID.
     */
    public function setTopicId(?string $topicId): self
    {
        $this->topicId = $topicId;
        return $this;
    }

    /**
     * 获取话题名称.
     */
    public function getTopicName(): ?string
    {
        return $this->topicName;
    }

    /**
     * 设置话题名称.
     */
    public function setTopicName(?string $topicName): self
    {
        $this->topicName = $topicName;
        return $this;
    }

    /**
     * 获取话题状态.
     */
    public function getTopicStatus(): ?string
    {
        return $this->topicStatus;
    }

    /**
     * 设置话题状态.
     */
    public function setTopicStatus(?string $topicStatus): self
    {
        $this->topicStatus = $topicStatus;
        return $this;
    }

    /**
     * 获取沙盒ID.
     */
    public function getSandboxId(): ?string
    {
        return $this->sandboxId;
    }

    /**
     * 设置沙盒ID.
     */
    public function setSandboxId(?string $sandboxId): self
    {
        $this->sandboxId = $sandboxId;
        return $this;
    }

    /**
     * 获取组织机构代码
     */
    public function getOrganizationCode(): ?string
    {
        return $this->organizationCode;
    }

    /**
     * 设置组织机构代码
     */
    public function setOrganizationCode(?string $organizationCode): self
    {
        $this->organizationCode = $organizationCode;
        return $this;
    }

    /**
     * 获取用户ID列表.
     */
    public function getUserIds(): ?array
    {
        return $this->userIds;
    }

    /**
     * 设置用户ID列表.
     */
    public function setUserIds(?array $userIds): self
    {
        $this->userIds = $userIds;
        return $this;
    }

    /**
     * 获取页码
     */
    public function getPage(): int
    {
        return $this->page;
    }

    /**
     * 设置页码
     */
    public function setPage(int $page): self
    {
        $this->page = max(1, $page);
        return $this;
    }

    /**
     * 获取每页条数.
     */
    public function getPageSize(): int
    {
        return $this->pageSize;
    }

    /**
     * 设置每页条数.
     */
    public function setPageSize(int $pageSize): self
    {
        $this->pageSize = max(1, $pageSize);
        return $this;
    }

    /**
     * 转换为条件数组.
     */
    public function toConditions(): array
    {
        $conditions = [];

        if ($this->topicId !== null) {
            $conditions['id'] = (int) $this->topicId;
        }

        if ($this->topicName !== null) {
            $conditions['topic_name'] = $this->topicName;
        }

        if ($this->topicStatus !== null) {
            $conditions['current_task_status'] = $this->topicStatus;
        }

        if ($this->sandboxId !== null) {
            $conditions['sandbox_id'] = $this->sandboxId;
        }

        if ($this->organizationCode !== null) {
            $conditions['user_organization_code'] = $this->organizationCode;
        }

        if ($this->userIds !== null && ! empty($this->userIds)) {
            $conditions['user_id'] = $this->userIds;
        }

        return $conditions;
    }
}
