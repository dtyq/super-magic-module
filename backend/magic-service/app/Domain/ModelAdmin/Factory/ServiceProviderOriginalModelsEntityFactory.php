<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\ModelAdmin\Factory;

use App\Domain\ModelAdmin\Entity\ServiceProviderOriginalModelsEntity;

class ServiceProviderOriginalModelsEntityFactory
{
    public static function toEntity(array $serviceProviderOriginalModels): ServiceProviderOriginalModelsEntity
    {
        return new ServiceProviderOriginalModelsEntity($serviceProviderOriginalModels);
    }

    public static function toEntities(array $serviceProviderOriginalModels): array
    {
        if (empty($serviceProviderOriginalModels)) {
            return [];
        }
        $serviceProviderOriginalModelsEntities = [];
        foreach ($serviceProviderOriginalModels as $serviceProviderOriginalModel) {
            $serviceProviderOriginalModelsEntities[] = self::toEntity((array) $serviceProviderOriginalModel);
        }
        return $serviceProviderOriginalModelsEntities;
    }

    /**
     * @param $serviceProviderOriginalModelsEntities ServiceProviderOriginalModelsEntity[]
     */
    public static function toArrays(array $serviceProviderOriginalModelsEntities): array
    {
        if (empty($serviceProviderOriginalModelsEntities)) {
            return [];
        }
        $serviceProviderOriginalModelsArrays = [];
        foreach ($serviceProviderOriginalModelsEntities as $serviceProviderOriginalModelsEntity) {
            $serviceProviderOriginalModelsArrays[] = $serviceProviderOriginalModelsEntity->toArray();
        }
        return $serviceProviderOriginalModelsArrays;
    }
}
