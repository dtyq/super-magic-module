<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\ModelAdmin\Repository\Persistence;

use App\Domain\ModelAdmin\Constant\OriginalModelType;
use App\Domain\ModelAdmin\Entity\ServiceProviderOriginalModelsEntity;
use App\Domain\ModelAdmin\Factory\ServiceProviderOriginalModelsEntityFactory;
use App\Domain\ModelAdmin\Repository\Model\ServiceProviderOriginalModelsModel;
use App\Infrastructure\Util\IdGenerator\IdGenerator;
use Hyperf\DbConnection\Db;

class ServiceProviderOriginalModelsRepository
{
    public function __construct(protected ServiceProviderOriginalModelsModel $serviceProviderOriginalModelsModel)
    {
    }

    /**
     * @return ServiceProviderOriginalModelsEntity[]
     */
    public function getAll(): array
    {
        $query = $this->serviceProviderOriginalModelsModel::query();
        $result = Db::select($query->toSql(), $query->getBindings());
        return ServiceProviderOriginalModelsEntityFactory::toEntities($result);
    }

    public function insert(ServiceProviderOriginalModelsEntity $serviceProviderOriginalModelsEntity): ServiceProviderOriginalModelsEntity
    {
        $date = date('Y-m-d H:i:s');
        $id = IdGenerator::getSnowId();
        $serviceProviderOriginalModelsEntity->setId($id);
        $serviceProviderOriginalModelsEntity->setCreatedAt($date);
        $serviceProviderOriginalModelsEntity->setUpdatedAt($date);
        $this->serviceProviderOriginalModelsModel::query()->insert($serviceProviderOriginalModelsEntity->toArray());
        return $serviceProviderOriginalModelsEntity;
    }

    public function updateById(ServiceProviderOriginalModelsEntity $serviceProviderOriginalModelsEntity): ServiceProviderOriginalModelsEntity
    {
        $serviceProviderOriginalModelsEntity->setUpdatedAt(date('Y-m-d H:i:s'));
        $this->serviceProviderOriginalModelsModel::query()
            ->where('id', $serviceProviderOriginalModelsEntity->getId())
            ->update($serviceProviderOriginalModelsEntity->toArray());
        return $serviceProviderOriginalModelsEntity;
    }

    public function deleteByModelId(string $modelId)
    {
        $this->serviceProviderOriginalModelsModel::query()
            ->where('model_id', $modelId)
            ->delete();
    }

    public function exist(string $modelId): bool
    {
        return $this->serviceProviderOriginalModelsModel::query()->where('model_id', $modelId)->exists();
    }

    public function existByOrganizationCodeAndModelId(string $organizationCode, string $modelId): bool
    {
        return $this->serviceProviderOriginalModelsModel::query()->where('organization_code', $organizationCode)->where('model_id', $modelId)->exists();
    }

    public function deleteByModelIdAndOrganizationCodeAndType(string $modelId, string $organizationCode, int $type): void
    {
        $this->serviceProviderOriginalModelsModel::query()
            ->where('model_id', $modelId)
            ->where('organization_code', $organizationCode)
            ->where('type', $type)
            ->delete();
    }

    public function listModels(string $organizationCode): array
    {
        // 通过一条sql查出，类型等于系统的以及组织编码等于当前组织编码的
        $query = $this->serviceProviderOriginalModelsModel::query()->where('type', OriginalModelType::SYSTEM_DEFAULT->value)->orWhere('organization_code', $organizationCode);
        $result = Db::select($query->toSql(), $query->getBindings());
        return ServiceProviderOriginalModelsEntityFactory::toEntities($result);
    }
}
