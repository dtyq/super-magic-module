<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\ModelAdmin\Factory;

use App\Domain\ModelAdmin\Entity\ServiceProviderEntity;
use App\Domain\ModelAdmin\Entity\ValueObject\ServiceProviderDTO;
use App\Domain\ModelAdmin\Repository\Model\ServiceProviderModel;
use Hyperf\Contract\TranslatorInterface;

class ServiceProviderEntityFactory
{
    public static function modelToEntity(ServiceProviderModel $model): ServiceProviderEntity
    {
        return new ServiceProviderEntity($model->toArray());
    }

    public static function toEntity(array $serviceProvider): ServiceProviderEntity
    {
        $serviceProviderEntity = new ServiceProviderEntity($serviceProvider);
        $translator = di(TranslatorInterface::class);
        $serviceProviderEntity->i18n($translator->getLocale());
        return $serviceProviderEntity;
    }

    public static function toEntities(array $serviceProviders): array
    {
        if (empty($serviceProviders)) {
            return [];
        }
        $serviceProviderEntities = [];
        foreach ($serviceProviders as $serviceProvider) {
            $serviceProviderEntities[] = self::toEntity((array) $serviceProvider);
        }
        return $serviceProviderEntities;
    }

    /**
     * @param $serviceProviderEntities ServiceProviderEntity[]
     */
    public static function toArrays(array $serviceProviderEntities): array
    {
        if (empty($serviceProviderEntities)) {
            return [];
        }
        $result = [];
        foreach ($serviceProviderEntities as $entity) {
            $result[] = $entity->toArray();
        }
        return $result;
    }

    public static function toDTO(ServiceProviderEntity $serviceProviderEntity, array $models): ServiceProviderDTO
    {
        $serviceProviderDTO = new ServiceProviderDTO($serviceProviderEntity->toArray());

        $serviceProviderDTO->setModels($models);
        return $serviceProviderDTO;
    }

    /**
     * @param $serviceProviderEntities ServiceProviderEntity[]
     * @return ServiceProviderDTO[]
     */
    public static function toDTOs(array $serviceProviderEntities): array
    {
        $serviceProviderDTOs = [];
        foreach ($serviceProviderEntities as $serviceProviderEntity) {
            $serviceProviderDTOs[] = self::toDTO($serviceProviderEntity, []);
        }
        return $serviceProviderDTOs;
    }
}
