<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\Flow\Repository\Persistence\Filter;

use App\Domain\Flow\Entity\ValueObject\FlowDataIsolation;
use Hyperf\Database\Model\Builder;

trait DataIsolationFilter
{
    public function addIsolationOrganizationCodeFilter(Builder $builder, FlowDataIsolation $dataIsolation, string $alias = 'organization_code'): void
    {
        if (! $dataIsolation->isEnable()) {
            return;
        }

        $organizationCodes = array_filter($dataIsolation->getOrganizationCodes());
        if (! empty($organizationCodes)) {
            if (count($organizationCodes) === 1) {
                $builder->where($alias, current($organizationCodes));
            } else {
                $builder->whereIn($alias, $organizationCodes);
            }
        }
    }

    public function addIsolationEnvironment(Builder $qb, FlowDataIsolation $dataIsolation, string $alias = 'environment'): void
    {
        if (! $dataIsolation->isEnable()) {
            return;
        }
        if (! empty($dataIsolation->getEnvironment())) {
            $qb->where($alias, $dataIsolation->getEnvironment());
        }
    }
}
