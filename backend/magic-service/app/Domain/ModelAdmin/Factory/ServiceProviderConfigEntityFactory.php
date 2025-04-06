<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\ModelAdmin\Factory;

use App\Domain\ModelAdmin\Entity\ServiceProviderConfigEntity;
use App\Domain\ModelAdmin\Entity\ValueObject\ServiceProviderConfig;
use App\Domain\ModelAdmin\Repository\Model\ServiceProviderConfigModel;
use App\Infrastructure\Util\Aes\AesUtil;
use Hyperf\Codec\Json;
use Hyperf\Contract\TranslatorInterface;

use function Hyperf\Config\config;

class ServiceProviderConfigEntityFactory
{
    public static function modelToEntity(ServiceProviderConfigModel $model): ServiceProviderConfigEntity
    {
        return new ServiceProviderConfigEntity($model->toArray());
    }

    public static function toEntity(array $serviceProviderConfig): ServiceProviderConfigEntity
    {
        $decodeConfig = self::decodeConfig($serviceProviderConfig['config'], (string) $serviceProviderConfig['id']);
        $serviceProviderConfig['config'] = new ServiceProviderConfig($decodeConfig);

        if (empty($serviceProviderConfig['translate'])) {
            $serviceProviderConfig['translate'] = [];
        }
        $translator = di(TranslatorInterface::class);
        $serviceProviderConfigEntity = new ServiceProviderConfigEntity($serviceProviderConfig);
        $serviceProviderConfigEntity->i18n($translator->getLocale());
        return $serviceProviderConfigEntity;
    }

    public static function toEntities(array $serviceProviderConfigs): array
    {
        if (empty($serviceProviderConfigs)) {
            return [];
        }
        $configEntities = [];
        foreach ($serviceProviderConfigs as $serviceProviderConfig) {
            $configEntities[] = self::toEntity((array) $serviceProviderConfig);
        }
        return $configEntities;
    }

    /**
     * @param $configEntities ServiceProviderConfigEntity[]
     */
    public static function toArrays(array $configEntities): array
    {
        if (empty($configEntities)) {
            return [];
        }
        $result = [];
        foreach ($configEntities as $entity) {
            $result[] = $entity->toArray();
        }
        return $result;
    }

    public static function decodeConfig(string $config, string $salt): array
    {
        $decode = AesUtil::decode(self::_getAesKey($salt), $config);
        if (! $decode) {
            return [];
        }
        return Json::decode($decode);
    }

    private static function _getAesKey(string $salt): string
    {
        return config('service_provider.model_aes_key') . $salt;
    }
}
