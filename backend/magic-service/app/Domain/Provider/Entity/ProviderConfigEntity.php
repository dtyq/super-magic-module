<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\Provider\Entity;

use App\Domain\Provider\Entity\ValueObject\ProviderConfigVO;
use App\Domain\Provider\Entity\ValueObject\Status;
use App\Infrastructure\Core\AbstractEntity;
use DateTime;

class ProviderConfigEntity extends AbstractEntity
{
    protected ?int $id = null;

    protected int $providerId;

    protected string $organizationCode;

    protected ProviderConfigVO $config;

    protected Status $status;

    protected string $alias = '';

    protected array $translate = [];

    protected DateTime $createdAt;

    protected DateTime $updatedAt;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function setId(?int $id): void
    {
        $this->id = $id;
    }

    public function getProviderId(): int
    {
        return $this->providerId;
    }

    public function setProviderId(int $providerId): void
    {
        $this->providerId = $providerId;
    }

    public function getOrganizationCode(): string
    {
        return $this->organizationCode;
    }

    public function setOrganizationCode(string $organizationCode): void
    {
        $this->organizationCode = $organizationCode;
    }

    public function getConfig(): ProviderConfigVO
    {
        return $this->config;
    }

    public function setConfig(ProviderConfigVO $config): void
    {
        $this->config = $config;
    }

    public function getStatus(): Status
    {
        return $this->status;
    }

    public function setStatus(Status $status): void
    {
        $this->status = $status;
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

    public function setTranslate(array $translate): void
    {
        $this->translate = $translate;
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
