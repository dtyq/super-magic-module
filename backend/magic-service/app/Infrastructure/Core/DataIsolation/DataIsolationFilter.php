<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\Core\DataIsolation;

use Hyperf\Database\Model\Builder;

trait DataIsolationFilter
{
    public function addIsolationOrganizationCodeFilter(Builder $builder, BaseDataIsolation $dataIsolation, string $alias = 'organization_code'): void
    {
        if (! $dataIsolation->isEnable()) {
            return;
        }

        $organizationCodes = array_filter($dataIsolation->getOrganizationCodes());
        if (! empty($organizationCodes)) {
            $builder->whereIn($alias, $organizationCodes);
        }
    }

    public function addIsolationEnvironment(Builder $qb, BaseDataIsolation $dataIsolation, string $alias = 'environment'): void
    {
        if (! $dataIsolation->isEnable()) {
            return;
        }
        if (! empty($dataIsolation->getEnvironment())) {
            $qb->where($alias, $dataIsolation->getEnvironment());
        }
    }
}
