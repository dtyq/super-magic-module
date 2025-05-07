<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\ModelAdmin\Entity\ValueObject;

use App\Domain\ModelAdmin\Constant\ServiceProviderCode;
use App\Domain\ModelAdmin\Constant\ServiceProviderType;
use App\Domain\ModelAdmin\Entity\ServiceProviderModelsEntity;

class ServiceProviderResponse
{
    // 服务商状态：官方/非官方
    protected ServiceProviderType $serviceProviderType;

    // 服务商配置信息
    protected ?ServiceProviderConfig $serviceProviderConfig;

    // 模型配置信息
    protected ModelConfig $modelConfig;

    protected ServiceProviderModelsEntity $serviceProviderModelsEntity;

    protected ServiceProviderCode $serviceProviderCode;

    public function setServiceProviderModelsEntity(ServiceProviderModelsEntity $serviceProviderModelsEntity): void
    {
        $this->serviceProviderModelsEntity = $serviceProviderModelsEntity;
    }

    public function getServiceProviderModelsEntity(): ServiceProviderModelsEntity
    {
        return $this->serviceProviderModelsEntity;
    }

    public function getServiceProviderType(): ServiceProviderType
    {
        return $this->serviceProviderType;
    }

    public function setServiceProviderType(ServiceProviderType $serviceProviderType): void
    {
        $this->serviceProviderType = $serviceProviderType;
    }

    public function getServiceProviderConfig(): ?ServiceProviderConfig
    {
        return $this->serviceProviderConfig;
    }

    public function setServiceProviderConfig(ServiceProviderConfig $serviceProviderConfig): void
    {
        $this->serviceProviderConfig = $serviceProviderConfig;
    }

    public function getModelConfig(): ModelConfig
    {
        return $this->modelConfig;
    }

    public function setModelConfig(ModelConfig $modelConfig): void
    {
        $this->modelConfig = $modelConfig;
    }

    public function getServiceProviderCode(): ServiceProviderCode
    {
        return $this->serviceProviderCode;
    }

    public function setServiceProviderCode(ServiceProviderCode|string $serviceProviderCode): ServiceProviderResponse
    {
        is_string($serviceProviderCode) && $serviceProviderCode = ServiceProviderCode::from($serviceProviderCode);
        $this->serviceProviderCode = $serviceProviderCode;
        return $this;
    }
}
