<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\ModelAdmin\Factory;

use App\Domain\ModelAdmin\Entity\ServiceProviderModelsEntity;
use App\Domain\ModelAdmin\Repository\Model\ServiceProviderModelsModel;
use Hyperf\Contract\TranslatorInterface;

class ServiceProviderModelsEntityFactory
{
    public static function modelToEntity(ServiceProviderModelsModel $model): ServiceProviderModelsEntity
    {
        return new ServiceProviderModelsEntity($model->toArray());
    }

    public static function toEntity(array $model): ServiceProviderModelsEntity
    {
        $serviceProviderModelsEntity = new ServiceProviderModelsEntity($model);
        $translator = di(TranslatorInterface::class);
        $serviceProviderModelsEntity->i18n($translator->getLocale());
        return $serviceProviderModelsEntity;
    }

    /**
     * @return ServiceProviderModelsEntity[]
     */
    public static function toEntities(array $models): array
    {
        if (empty($models)) {
            return [];
        }
        $modelEntities = [];
        foreach ($models as $model) {
            $modelEntities[] = self::toEntity((array) $model);
        }
        return $modelEntities;
    }

    /**
     * @param $modelEntities ServiceProviderModelsEntity[]
     */
    public static function toArrays(array $modelEntities): array
    {
        if (empty($modelEntities)) {
            return [];
        }
        $result = [];
        foreach ($modelEntities as $entity) {
            $result[] = $entity->toArray();
        }
        return $result;
    }
}
