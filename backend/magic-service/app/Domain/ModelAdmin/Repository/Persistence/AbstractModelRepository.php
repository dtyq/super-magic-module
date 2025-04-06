<?php

/** @noinspection ALL */

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\ModelAdmin\Repository\Persistence;

use App\Domain\ModelAdmin\Entity\ServiceProviderConfigEntity;
use App\Domain\ModelAdmin\Entity\ServiceProviderModelsEntity;
use App\Domain\ModelAdmin\Event\EndpointChangeEvent;
use App\Domain\ModelAdmin\Factory\ServiceProviderConfigEntityFactory;
use App\Domain\ModelAdmin\Factory\ServiceProviderModelsEntityFactory;
use App\Domain\ModelAdmin\Repository\Model\ServiceProviderConfigModel;
use App\Domain\ModelAdmin\Repository\Model\ServiceProviderModel;
use App\Domain\ModelAdmin\Repository\Model\ServiceProviderModelsModel;
use App\Interfaces\ModelGateway\Assembler\EndpointAssembler;
use Hyperf\DbConnection\Db;

abstract class AbstractModelRepository
{
    public function __construct(
        protected ServiceProviderConfigModel $configModel,
        protected ServiceProviderModelsModel $serviceProviderModelsModel,
        protected ServiceProviderModel $serviceProviderModel
    ) {
    }

    /**
     * @return ServiceProviderModelsEntity[]
     */
    public function getModelsByIds(array $modelIds): array
    {
        if (empty($modelIds)) {
            return [];
        }
        $query = $this->serviceProviderModelsModel::query()->whereIn('id', $modelIds);
        $result = Db::select($query->toSql(), $query->getBindings());
        return ServiceProviderModelsEntityFactory::toEntities($result);
    }

    /**
     * 根据配置ID数组获取配置实体列表.
     * @return ServiceProviderConfigEntity[]
     */
    public function getConfigsByIds(array $configIds): array
    {
        if (empty($configIds)) {
            return [];
        }
        $query = $this->configModel::query()->whereIn('id', $configIds);
        $result = Db::select($query->toSql(), $query->getBindings());
        return ServiceProviderConfigEntityFactory::toEntities($result);
    }

    /**
     * 根据多个服务商配置ID获取模型列表.
     * @param array $configIds 服务商配置ID数组
     * @return ServiceProviderModelsEntity[]
     */
    public function getModelsByServiceProviderConfigIds(array $configIds): array
    {
        if (empty($configIds)) {
            return [];
        }

        $query = $this->serviceProviderModelsModel::query()->whereIn('service_provider_config_id', $configIds);
        $result = Db::select($query->toSql(), $query->getBindings());

        return ServiceProviderModelsEntityFactory::toEntities($result);
    }

    /**
     * 处理模型变更并分发事件的通用方法.
     * @param array $entitiesOrIds 模型实体数组或模型ID数组
     * @param bool $isDelete 是否为删除操作
     */
    protected function handleModelsChangeAndDispatch(array $entitiesOrIds, bool $isDelete = false): void
    {
        if (empty($entitiesOrIds)) {
            return;
        }

        // 检查是否为ID数组，如果是则查询转换为实体对象
        if (! $entitiesOrIds[0] instanceof ServiceProviderModelsEntity) {
            // 假定为ID数组，查询获取实体对象
            $entities = $this->getModelsByIds($entitiesOrIds);
        } else {
            $entities = $entitiesOrIds;
        }
        if (empty($entities)) {
            return;
        }

        // 从模型实体中收集配置ID
        $configIds = [];
        foreach ($entities as $entity) {
            $configIds[] = (string) $entity->getServiceProviderConfigId();
        }
        $configIds = array_unique($configIds);

        // 获取服务商配置
        $configEntities = $this->getConfigsByIds($configIds);
        if (empty($configEntities)) {
            return;
        }

        // 创建配置ID到配置实体的映射
        /** @var array<int,ServiceProviderConfigEntity> $configMap */
        $configMap = [];
        foreach ($configEntities as $configEntity) {
            $configMap[$configEntity->getId()] = $configEntity;
        }

        // 转换为EndpointEntity
        $endpointEntities = EndpointAssembler::toEndpointEntities($entities, $configMap, $isDelete);

        // 分发事件
        if (! empty($endpointEntities)) {
            event_dispatch(new EndpointChangeEvent($endpointEntities, $isDelete));
        }
    }
}
