<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Interfaces\ModelGateway\Assembler;

use App\Domain\ModelAdmin\Entity\ServiceProviderConfigEntity;
use App\Domain\ModelAdmin\Entity\ServiceProviderModelsEntity;
use App\Infrastructure\Core\HighAvailability\Entity\EndpointEntity;
use App\Infrastructure\Core\HighAvailability\Entity\ValueObject\CircuitBreakerStatus;
use App\Infrastructure\Core\HighAvailability\Entity\ValueObject\DelimiterType;

class EndpointAssembler
{
    /**
     * 将单个ServiceProviderModelsEntity转换为EndpointEntity.
     */
    public static function toEndpointEntity(
        ServiceProviderModelsEntity $entity,
        ?ServiceProviderConfigEntity $serviceProviderConfigEntity
    ): ?EndpointEntity {
        if (empty($serviceProviderConfigEntity)) {
            return null;
        }

        $endpoint = new EndpointEntity();
        $endpoint->setType($entity->getModelId());
        $endpoint->setName((string) $entity->getId());
        $endpoint->setProvider((string) $serviceProviderConfigEntity->getServiceProviderId());
        $endpoint->setEnabled($entity->getStatus() === 1);
        $endpoint->setCircuitBreakerStatus(CircuitBreakerStatus::CLOSED);
        $endpoint->setConfig('');

        return $endpoint;
    }

    /**
     * 将多个ServiceProviderModelsEntity转换为EndpointEntity数组.
     *
     * @param ServiceProviderModelsEntity[] $providerModelsEntities 服务商模型实体数组
     * @param array<int,ServiceProviderConfigEntity> $configMap 服务商配置ID到配置实体的映射数组
     * @param bool $isDelete 是否为删除操作
     * @return EndpointEntity[]
     */
    public static function toEndpointEntities(
        array $providerModelsEntities,
        array $configMap,
        bool $isDelete = false
    ): array {
        if (empty($providerModelsEntities) || empty($configMap)) {
            return [];
        }
        $endpoints = [];
        foreach ($providerModelsEntities as $entity) {
            $configId = $entity->getServiceProviderConfigId();

            // 如果找不到对应的服务商配置，则跳过该模型
            if (! isset($configMap[$configId])) {
                continue;
            }
            // 模型 id 不能为空
            if (empty($entity->getModelId())) {
                continue;
            }
            $endpointConfigEntity = $configMap[$configId];
            $endpoint = new EndpointEntity();

            // 设置标识信息以便在高可用服务中唯一标识该端点
            $endpoint->setType(self::getEndpointTypeByModelIdAndOrgCode($entity->getModelId(), $entity->getOrganizationCode()));
            $endpoint->setName((string) $entity->getId());
            $endpoint->setProvider((string) $endpointConfigEntity->getServiceProviderId());

            // 如果不是删除操作，设置启用状态
            if (! $isDelete) {
                // 状态需要根据服务商+模型状态双重确定，必须要同时开启，接入点才被启用
                $endpoint->setEnabled($entity->getStatus() === 1 && $endpointConfigEntity->getStatus() === 1);
                $endpoint->setCircuitBreakerStatus(CircuitBreakerStatus::CLOSED);
            }

            $endpoints[] = $endpoint;
        }

        return $endpoints;
    }

    public static function getEndpointTypeByModelIdAndOrgCode(
        string $modelId,
        string $orgCode
    ): string {
        return $modelId . DelimiterType::MODEL->value . $orgCode;
    }
}
