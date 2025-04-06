<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\Core\HighAvailability\Entity;

use App\Infrastructure\Core\AbstractEntity;
use App\Infrastructure\Core\HighAvailability\Entity\ValueObject\CircuitBreakerStatus;

class EndpointEntity extends AbstractEntity
{
    // 前端可能不支持 bigint，所以这里用 string
    protected string $id;

    /**
     * 接入点类型.
     */
    protected string $type;

    /**
     * 提供商.
     */
    protected ?string $provider = null;

    /**
     * 接入点名称.
     */
    protected string $name;

    /**
     * 配置信息.
     */
    protected ?string $config = null;

    /**
     * 资源的消耗的 id 列表. 一次请求可能会消耗多个资源。
     * @var string[]
     */
    protected array $resources = [];

    /**
     * 接入点是否启用.
     */
    protected bool $enabled = true;

    /**
     * 熔断状态.
     */
    protected CircuitBreakerStatus $circuitBreakerStatus;

    /**
     * 创建时间.
     */
    protected string $createdAt;

    /**
     * 更新时间.
     */
    protected string $updatedAt;

    public function __construct($data = [])
    {
        parent::__construct($data);
    }

    public function getResources(): array
    {
        return $this->resources;
    }

    public function setResources(null|array|string $resources): static
    {
        if (is_string($resources)) {
            $resources = json_decode($resources, true);
        } elseif (! is_array($resources)) {
            $resources = [];
        }
        $this->resources = $resources;
        return $this;
    }

    public function getId(): string
    {
        return $this->id ?? '';
    }

    public function setId(null|int|string $id): static
    {
        $this->id = (string) $id;
        return $this;
    }

    public function getType(): string
    {
        return $this->type ?? '';
    }

    public function setType(string $type): static
    {
        $this->type = $type;
        return $this;
    }

    public function getProvider(): ?string
    {
        return $this->provider;
    }

    public function setProvider(?string $provider): static
    {
        $this->provider = $provider;
        return $this;
    }

    public function getName(): string
    {
        return $this->name ?? '';
    }

    public function setName(string $name): static
    {
        $this->name = $name;
        return $this;
    }

    public function getConfig(): ?string
    {
        return $this->config;
    }

    public function setConfig(?string $value): static
    {
        $this->config = $value;
        return $this;
    }

    public function getCreatedAt(): string
    {
        return $this->createdAt ?? '';
    }

    public function setCreatedAt(string $createdAt): static
    {
        $this->createdAt = $createdAt;
        return $this;
    }

    public function getUpdatedAt(): string
    {
        return $this->updatedAt ?? '';
    }

    public function setUpdatedAt(string $updatedAt): static
    {
        $this->updatedAt = $updatedAt;
        return $this;
    }

    public function getCircuitBreakerStatus(): CircuitBreakerStatus
    {
        return $this->circuitBreakerStatus;
    }

    public function setCircuitBreakerStatus(CircuitBreakerStatus|string $circuitBreakerStatus): void
    {
        if (is_string($circuitBreakerStatus)) {
            $this->circuitBreakerStatus = CircuitBreakerStatus::fromString($circuitBreakerStatus);
            return;
        }
        $this->circuitBreakerStatus = $circuitBreakerStatus;
    }

    public function isEnabled(): bool
    {
        return $this->enabled;
    }

    /**
     * 设置接入点是否启用.
     * @param bool|int|string $enabled 可传入布尔值、整数或字符串
     */
    public function setEnabled(bool|int|string $enabled): static
    {
        if (is_numeric($enabled)) {
            $this->enabled = (bool) $enabled;
        } else {
            $this->enabled = $enabled;
        }
        return $this;
    }
}
