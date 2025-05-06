<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\Provider\Repository\Persistence;

use App\Domain\Provider\Entity\ProviderConfigEntity;
use App\Domain\Provider\Entity\ValueObject\ProviderDataIsolation;
use App\Domain\Provider\Factory\ProviderConfigFactory;
use App\Domain\Provider\Repository\Facade\ProviderConfigRepositoryInterface;
use App\Domain\Provider\Repository\Persistence\Model\ServiceProviderConfigModel;

class ProviderConfigRepository extends ProviderAbstractRepository implements ProviderConfigRepositoryInterface
{
    protected bool $filterOrganizationCode = true;

    public function getById(ProviderDataIsolation $dataIsolation, int $id): ?ProviderConfigEntity
    {
        $builder = $this->createBuilder($dataIsolation, ServiceProviderConfigModel::query());

        /** @var null|ServiceProviderConfigModel $model */
        $model = $builder->where('id', $id)->first();

        if (! $model) {
            return null;
        }

        return ProviderConfigFactory::createEntity($model);
    }

    public function getByServiceProviderId(ProviderDataIsolation $dataIsolation, int $serviceProviderId): ?ProviderConfigEntity
    {
        $builder = $this->createBuilder($dataIsolation, ServiceProviderConfigModel::query());

        /** @var null|ServiceProviderConfigModel $model */
        $model = $builder->where('service_provider_id', $serviceProviderId)->first();

        if (! $model) {
            return null;
        }

        return ProviderConfigFactory::createEntity($model);
    }
}
