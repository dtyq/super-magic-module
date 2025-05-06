<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\Provider\Repository\Persistence;

use App\Domain\Provider\Entity\ProviderEntity;
use App\Domain\Provider\Entity\ValueObject\ProviderDataIsolation;
use App\Domain\Provider\Entity\ValueObject\Query\ProviderQuery;
use App\Domain\Provider\Factory\ProviderFactory;
use App\Domain\Provider\Repository\Facade\ProviderRepositoryInterface;
use App\Domain\Provider\Repository\Persistence\Model\ProviderModel;
use App\Infrastructure\Core\ValueObject\Page;

class ProviderRepository extends ProviderAbstractRepository implements ProviderRepositoryInterface
{
    protected bool $filterOrganizationCode = true;

    public function getById(ProviderDataIsolation $dataIsolation, int $id): ?ProviderEntity
    {
        $builder = $this->createBuilder($dataIsolation, ProviderModel::query());

        /** @var null|ProviderModel $model */
        $model = $builder->where('id', $id)->first();

        if (! $model) {
            return null;
        }

        return ProviderFactory::createEntity($model);
    }

    public function getByCode(ProviderDataIsolation $dataIsolation, string $providerCode): ?ProviderEntity
    {
        $builder = $this->createBuilder($dataIsolation, ProviderModel::query());

        /** @var null|ProviderModel $model */
        $model = $builder->where('provider_code', $providerCode)->first();

        if (! $model) {
            return null;
        }

        return ProviderFactory::createEntity($model);
    }

    /**
     * @return array{total: int, list: array<ProviderEntity>}
     */
    public function queries(ProviderDataIsolation $dataIsolation, ProviderQuery $query, Page $page): array
    {
        $builder = $this->createBuilder($dataIsolation, ProviderModel::query());

        if ($query->getCategory()) {
            $builder->where('category', $query->getCategory()->value);
        }

        if ($query->getStatus()) {
            $builder->where('status', $query->getStatus()->value);
        }

        $result = $this->getByPage($builder, $page, $query);

        $list = [];
        /** @var ProviderModel $model */
        foreach ($result['list'] as $model) {
            $list[] = ProviderFactory::createEntity($model);
        }

        return [
            'total' => $result['total'],
            'list' => $list,
        ];
    }
}
