<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\ModelAdmin\Service\Provider;

use App\Domain\ModelAdmin\Entity\ServiceProviderEntity;
use App\Domain\ModelAdmin\Entity\ServiceProviderModelsEntity;
use App\Domain\ModelAdmin\Entity\ValueObject\ServiceProviderConfig;
use JetBrains\PhpStorm\Deprecated;

/**
 * 服务商接口.
 */
interface IProvider
{
    /**
     * 目前没有该需求了，接口暂时不删（可能后续又要呢）.
     * @return ServiceProviderModelsEntity[]
     */
    #[Deprecated]
    public function getModels(ServiceProviderEntity $serviceProviderEntity): array;

    /**
     * 连通性测试.
     */
    public function connectivityTestByModel(ServiceProviderConfig $serviceProviderConfig, string $modelVersion): ConnectResponse;
}
