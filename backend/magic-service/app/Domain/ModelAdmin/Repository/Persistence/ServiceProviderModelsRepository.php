<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\ModelAdmin\Repository\Persistence;

use App\Domain\ModelAdmin\Constant\ModelType;
use App\Domain\ModelAdmin\Constant\Status;
use App\Domain\ModelAdmin\Entity\ServiceProviderModelsEntity;
use App\Domain\ModelAdmin\Factory\ServiceProviderModelsEntityFactory;
use App\ErrorCode\ServiceProviderErrorCode;
use App\Infrastructure\Core\Exception\ExceptionBuilder;
use App\Infrastructure\Util\IdGenerator\IdGenerator;
use Hyperf\Codec\Json;
use Hyperf\Database\Model\Builder as ModelBuilder;
use Hyperf\Database\Query\Builder as QueryBuilder;
use Hyperf\DbConnection\Annotation\Transactional;
use Hyperf\DbConnection\Db;

class ServiceProviderModelsRepository extends AbstractModelRepository
{
    /**
     * 根据厂商id查询所有模型.
     * @return ServiceProviderModelsEntity[]
     */
    public function getModelsByServiceProviderId(int $serviceProviderId): array
    {
        $query = $this->serviceProviderModelsModel::query()->where('service_provider_config_id', $serviceProviderId);
        return $this->executeQueryAndToEntities($query);
    }

    /**
     * 添加或更新模型.
     */
    #[Transactional]
    public function saveModels(ServiceProviderModelsEntity $serviceProviderModelsEntity): ServiceProviderModelsEntity
    {
        $isNew = ! $serviceProviderModelsEntity->getId();
        $entityArray = $this->prepareEntityForSave($serviceProviderModelsEntity, $isNew);

        if ($isNew) {
            $this->serviceProviderModelsModel::query()->insert($entityArray);
            $serviceProviderModelsEntity->setId($entityArray['id']);
        } else {
            $this->serviceProviderModelsModel::query()->where('id', $serviceProviderModelsEntity->getId())->update($entityArray);
        }

        $this->handleModelsChangeAndDispatch([$serviceProviderModelsEntity]);

        return $serviceProviderModelsEntity;
    }

    // 更新模型
    #[Transactional]
    public function updateModelById(ServiceProviderModelsEntity $entity): void
    {
        $entityArray = $this->prepareEntityForSave($entity);
        $this->serviceProviderModelsModel::query()->where('id', $entity->getId())->update($entityArray);

        $this->handleModelsChangeAndDispatch([$entity->getId()]);
    }

    // 删除模型
    public function deleteByIds(array $ids): void
    {
        if (empty($ids)) {
            return;
        }

        $query = $this->serviceProviderModelsModel::query()->whereIn('id', $ids);
        $this->queryThenDeleteAndDispatch($query);
    }

    // 根据厂商id和模型id改变模型的状态
    #[Transactional]
    public function changeModelStatus(int $serviceProviderId, int $modelId, int $status): void
    {
        $this->serviceProviderModelsModel::query()
            ->where('service_provider_config_id', $serviceProviderId)
            ->where('id', $modelId)
            ->update(['status' => $status]);

        $this->handleModelsChangeAndDispatch([$modelId]);
    }

    /**
     * @return ServiceProviderModelsEntity[]
     */
    public function getByIds(array $modelIds): array
    {
        return $this->getModelsByIds($modelIds);
    }

    /**
     * @return ServiceProviderModelsEntity[]
     */
    public function getByProviderId(int $serviceProviderId): array
    {
        $query = $this->serviceProviderModelsModel::query()->where('service_provider_config_id', $serviceProviderId);
        return $this->executeQueryAndToEntities($query);
    }

    public function deleteByModelIdAndOrganizationCode(string $modelId, string $organizationCode)
    {
        $query = $this->serviceProviderModelsModel::query()
            ->where('id', $modelId)
            ->where('organization_code', $organizationCode);

        $this->queryThenDeleteAndDispatch($query);
    }

    /**
     * @return ServiceProviderModelsEntity[]
     */
    public function getModelStatusByServiceProviderConfigIdAndOrganizationCode(string $serviceProviderConfigId, string $organizationCode): array
    {
        $query = $this->serviceProviderModelsModel::query()
            ->where('service_provider_config_id', $serviceProviderConfigId)
            ->where('organization_code', $organizationCode);

        return $this->executeQueryAndToEntities($query);
    }

    #[Transactional]
    public function updateModelStatus(string $id, string $organizationCode, Status $status)
    {
        $this->serviceProviderModelsModel::query()
            ->where('id', $id)
            ->where('organization_code', $organizationCode)
            ->update(['status' => $status->value]);
        $this->handleModelsChangeAndDispatch([$id]);
    }

    /**
     * @return array<ServiceProviderModelsEntity>
     */
    public function getActiveModelsByOrganizationCode(array $serviceProviderConfigIds, string $organizationCode): array
    {
        if (empty($serviceProviderConfigIds)) {
            return [];
        }

        $query = $this->serviceProviderModelsModel::query()
            ->where('organization_code', $organizationCode)
            ->whereIn('service_provider_config_id', $serviceProviderConfigIds)
            ->where('status', Status::ACTIVE->value);

        return $this->executeQueryAndToEntities($query);
    }

    public function getById(string $modelId, bool $throw = true): ?ServiceProviderModelsEntity
    {
        $query = $this->serviceProviderModelsModel::query()->where('id', $modelId);
        $result = Db::selectOne($query->toSql(), $query->getBindings());
        if (! $result) {
            $throw && ExceptionBuilder::throw(ServiceProviderErrorCode::ModelNotFound);
            return null;
        }
        return ServiceProviderModelsEntityFactory::toEntity($result);
    }

    /**
     * @param $serviceProviderModelsEntities ServiceProviderModelsEntity[]
     */
    #[Transactional]
    public function batchInsert(array $serviceProviderModelsEntities): void
    {
        if (empty($serviceProviderModelsEntities)) {
            return;
        }

        $date = date('Y-m-d H:i:s');
        $data = [];
        foreach ($serviceProviderModelsEntities as $entity) {
            $entity->setId(IdGenerator::getSnowId());
            $entity->setUpdatedAt($date);
            $entity->setCreatedAt($date);
            $entityArray = $entity->toArray();
            $entityArray['config'] = Json::encode($entity->getConfig() ? $entity->getConfig()->toArray() : []);
            $entityArray['translate'] = Json::encode($entity->getTranslate() ?: []);
            $data[] = $entityArray;
        }

        $this->serviceProviderModelsModel::query()->insert($data);

        $this->handleModelsChangeAndDispatch($serviceProviderModelsEntities);
    }

    /**
     * 根据模型版本和服务提供商配置ID删除记录
     * 用于批量删除同版本模型.
     */
    public function deleteByModelVersion(string $modelVersion): void
    {
        $query = $this->serviceProviderModelsModel::query()->where('model_version', $modelVersion);
        $this->queryThenDeleteAndDispatch($query);
    }

    /**
     * @param $serviceProviderConfigIds int[]
     */
    public function deleteByServiceProviderConfigIdsAndModelVersion(array $serviceProviderConfigIds, string $modelVersion)
    {
        if (empty($serviceProviderConfigIds)) {
            return;
        }

        $query = $this->serviceProviderModelsModel::query()
            ->whereIn('service_provider_config_id', $serviceProviderConfigIds)
            ->where('model_version', $modelVersion);

        $this->queryThenDeleteAndDispatch($query);
    }

    /**
     * 批量保存模型数据.
     * @param ServiceProviderModelsEntity[] $modelEntities 模型实体数组
     */
    #[Transactional]
    public function batchSaveModels(array $modelEntities): void
    {
        if (empty($modelEntities)) {
            return;
        }

        $dataToInsert = [];
        foreach ($modelEntities as $entity) {
            $dataToInsert[] = $this->prepareEntityForSave($entity, true);
        }

        $this->serviceProviderModelsModel::query()->insert($dataToInsert);

        $this->handleModelsChangeAndDispatch($modelEntities);
    }

    /**
     * 根据服务商ID获取基础模型列表（不依赖特定组织）
     * 用于初始化新组织时获取模型基础数据.
     * @param int $serviceProviderId 服务商ID
     * @return ServiceProviderModelsEntity[]
     */
    public function getBaseModelsByServiceProviderId(int $serviceProviderId): array
    {
        // 首先从service_provider_config表中查询出一个样例配置ID
        $configQuery = Db::table('service_provider_config')
            ->select('id')
            ->where('service_provider_id', $serviceProviderId)
            ->limit(1);

        $configResult = Db::selectOne($configQuery->toSql(), $configQuery->getBindings());

        if (! $configResult) {
            return [];
        }

        $configId = $configResult->id;

        // 使用这个配置ID查询模型
        $query = $this->serviceProviderModelsModel::query()
            ->where('service_provider_config_id', $configId);

        return $this->executeQueryAndToEntities($query);
    }

    /**
     * 根据多个服务商配置ID批量获取模型列表
     * 简化后的方法，直接根据配置ID查询模型.
     * @param array $configIds 服务商配置ID数组
     * @return ServiceProviderModelsEntity[] 模型数组
     */
    public function getModelsByConfigIds(array $configIds): array
    {
        return $this->getModelsByServiceProviderConfigIds($configIds);
    }

    public function getModelsByVersionAndOrganization(string $modelVersion, string $organizationCode): array
    {
        $query = $this->serviceProviderModelsModel->newQuery()
            ->where('organization_code', $organizationCode)
            ->where('model_version', $modelVersion)
            ->where('status', Status::ACTIVE->value);

        $results = Db::select($query->toSql(), $query->getBindings());
        return ServiceProviderModelsEntityFactory::toEntities($results);
    }

    public function getModelsByVersionIdAndOrganization(string $modelId, string $organizationCode): array
    {
        $query = $this->serviceProviderModelsModel->newQuery()
            ->where('organization_code', $organizationCode)
            ->where('model_id', $modelId)
            ->where('status', Status::ACTIVE->value);

        return $this->executeQueryAndToEntities($query);
    }

    /**
     * 获取所有模型数据.
     * @return ServiceProviderModelsEntity[]
     */
    public function getAllModels(): array
    {
        $query = $this->serviceProviderModelsModel::query();
        return $this->executeQueryAndToEntities($query);
    }

    public function getModelByIdAndOrganizationCode(string $modelId, string $organizationCode): ?ServiceProviderModelsEntity
    {
        $query = $this->serviceProviderModelsModel::query()->where('id', $modelId)->where('organization_code', $organizationCode);
        $result = Db::selectOne($query->toSql(), $query->getBindings());
        if (! $result) {
            return null;
        }
        return ServiceProviderModelsEntityFactory::toEntity($result);
    }

    public function deleteByServiceProviderConfigId(string $serviceProviderConfigId, string $organizationCode): void
    {
        $query = $this->serviceProviderModelsModel::query()->where('service_provider_config_id', $serviceProviderConfigId)->where('organization_code', $organizationCode);
        $this->queryThenDeleteAndDispatch($query);
    }

    /**
     * 根据模型类型获取启用模型.
     */
    public function findActiveModelByType(ModelType $modelType, ?string $organizationCode): ?ServiceProviderModelsEntity
    {
        $res = $this->serviceProviderModelsModel::query()
            ->select('service_provider_models.*')
            ->leftJoin('service_provider_configs', 'service_provider_models.service_provider_config_id', '=', 'service_provider_configs.id')
            ->leftJoin('service_provider', 'service_provider_configs.service_provider_id', '=', 'service_provider.id')
            ->where('service_provider.status', Status::ACTIVE->value)
            ->where('service_provider_configs.status', Status::ACTIVE->value)
            ->where('service_provider.deleted_at', null)
            ->where('service_provider_configs.deleted_at', null)
            ->where('service_provider_models.model_type', $modelType->value)
            ->where('service_provider_models.organization_code', $organizationCode)
            ->where('service_provider_models.status', Status::ACTIVE->value)
            ?->first()
            ?->toArray();
        if ($res) {
            return ServiceProviderModelsEntityFactory::toEntity($res);
        }

        return null;
    }

    /**
     * 执行查询并转换为实体数组.
     * @return ServiceProviderModelsEntity[]
     */
    private function executeQueryAndToEntities(ModelBuilder|QueryBuilder $query): array
    {
        $result = Db::select($query->toSql(), $query->getBindings());
        return ServiceProviderModelsEntityFactory::toEntities($result);
    }

    /**
     * 执行查询并返回单个实体.
     */
    /* @phpstan-ignore-next-line */
    private function executeQueryAndToEntity(ModelBuilder|QueryBuilder $query): ServiceProviderModelsEntity
    {
        $result = Db::selectOne($query->toSql(), $query->getBindings());
        if (! $result) {
            ExceptionBuilder::throw(ServiceProviderErrorCode::ModelNotFound);
        }
        return ServiceProviderModelsEntityFactory::toEntity($result);
    }

    /**
     * 准备实体数据用于保存.
     */
    private function prepareEntityForSave(ServiceProviderModelsEntity $entity, bool $isNew = false): array
    {
        $date = date('Y-m-d H:i:s');
        $entity->setUpdatedAt($date);

        if ($isNew) {
            $entity->setId(IdGenerator::getSnowId());
            $entity->setCreatedAt($date);
        }

        $entityArray = $entity->toArray();
        $entityArray['config'] = Json::encode($entity->getConfig() ? $entity->getConfig()->toArray() : []);
        $entityArray['translate'] = Json::encode($entity->getTranslate() ?: []);
        return $entityArray;
    }

    /**
     * 先查询再删除并触发事件的通用模式.
     */
    #[Transactional]
    private function queryThenDeleteAndDispatch(ModelBuilder|QueryBuilder $query): void
    {
        $models = $this->executeQueryAndToEntities($query);

        if (! empty($models)) {
            $query->delete();

            $this->handleModelsChangeAndDispatch($models, true);
        }
    }
}
