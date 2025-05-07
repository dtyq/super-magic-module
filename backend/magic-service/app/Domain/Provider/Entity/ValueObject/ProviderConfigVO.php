<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\Provider\Entity\ValueObject;

use App\Infrastructure\Core\AbstractValueObject;

class ProviderConfigVO extends AbstractValueObject
{
    protected string $ak = '';

    protected string $sk = '';

    protected string $apiKey = '';

    protected string $url = '';

    protected string $proxyUrl = '';

    protected string $apiVersion = '';

    protected string $deploymentName = '';

    protected string $region = '';

    public function getAk(): string
    {
        return $this->ak;
    }

    public function getSk(): string
    {
        return $this->sk;
    }

    public function getApiKey(): string
    {
        return $this->apiKey;
    }

    public function getUrl(): string
    {
        return $this->url;
    }

    public function getProxyUrl(): string
    {
        return $this->proxyUrl;
    }

    public function getApiVersion(): string
    {
        return $this->apiVersion;
    }

    public function getDeploymentName(): string
    {
        return $this->deploymentName;
    }

    public function getRegion(): string
    {
        return $this->region;
    }
}
