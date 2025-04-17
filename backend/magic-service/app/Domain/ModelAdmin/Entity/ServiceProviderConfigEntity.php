<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\ModelAdmin\Entity;

use App\Domain\ModelAdmin\Constant\ServiceProviderCode;
use App\Domain\ModelAdmin\Constant\Status;
use App\Domain\ModelAdmin\Entity\ValueObject\ServiceProviderConfig;
use Hyperf\Codec\Json;

class ServiceProviderConfigEntity extends AbstractEntity
{
    protected int $id;

    protected string $alias = '';

    protected int $serviceProviderId;

    protected string $organizationCode;

    protected ?ServiceProviderConfig $config = null;

    protected int $status = Status::DISABLE->value;

    protected array $translate = [];

    protected string $createdAt;

    protected string $updatedAt;

    protected ?string $deletedAt;

    private ?ServiceProviderCode $providerCode = null;

    public function getImplementation(): ?string
    {
        return $this->providerCode?->getImplementation();
    }

    public function getActualImplementationConfig(): array
    {
        if (! $this->config || ! $this->providerCode) {
            return [];
        }
        return $this->providerCode->getImplementationConfig($this->config);
    }

    public function setId(int|string $id): void
    {
        $this->id = (int) $id;
    }

    public function getId(): int
    {
        return $this->id;
    }

    public function getServiceProviderId(): int
    {
        return $this->serviceProviderId;
    }

    public function getOrganizationCode(): string
    {
        return $this->organizationCode;
    }

    public function getConfig(): ?ServiceProviderConfig
    {
        return $this->config;
    }

    public function getStatus(): int
    {
        return $this->status;
    }

    public function isActive(): bool
    {
        return $this->getStatus() === Status::ACTIVE->value;
    }

    public function enable(): void
    {
        $this->status = 1;
    }

    public function disable(): void
    {
        $this->status = 0;
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

    public function setServiceProviderId(int $serviceProviderId): void
    {
        $this->serviceProviderId = $serviceProviderId;
    }

    public function setOrganizationCode(string $organizationCode): void
    {
        $this->organizationCode = $organizationCode;
    }

    public function setConfig(null|array|ServiceProviderConfig $config): void
    {
        if (is_array($config)) {
            $config = new ServiceProviderConfig($config);
        }
        $this->config = $config;
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

    public function getProviderCode(): ?ServiceProviderCode
    {
        return $this->providerCode;
    }

    public function setProviderCode(?ServiceProviderCode $providerCode): void
    {
        $this->providerCode = $providerCode;
    }

    public function getAlias(): string
    {
        return $this->alias;
    }

    public function setAlias(string $alias): void
    {
        $this->alias = $alias;
    }

    public function getTranslate(): array
    {
        return $this->translate;
    }

    public function setTranslate(null|array|string $translate): void
    {
        if (is_string($translate)) {
            $translate = Json::decode($translate);
        }
        $this->translate = $translate;
    }

    public function i18n(string $languages)
    {
        if (isset($this->translate['alias'][$languages])) {
            $this->alias = $this->translate['alias'][$languages];
        }
    }
}
