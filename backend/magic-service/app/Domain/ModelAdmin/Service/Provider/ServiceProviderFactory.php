<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\ModelAdmin\Service\Provider;

use App\Domain\ModelAdmin\Constant\ServiceProviderCategory;
use App\Domain\ModelAdmin\Constant\ServiceProviderCode;
use App\Domain\ModelAdmin\Service\Provider\VLM\MiracleVisionProvider;
use App\Domain\ModelAdmin\Service\Provider\VLM\TTAPIProvider;
use App\Domain\ModelAdmin\Service\Provider\VLM\VLMVolcengineProvider;
use Exception;

class ServiceProviderFactory
{
    public static function get(ServiceProviderCode $serviceProviderCode, ServiceProviderCategory $serviceProviderCategory): IProvider
    {
        return match ($serviceProviderCategory) {
            ServiceProviderCategory::VLM => match ($serviceProviderCode) {
                ServiceProviderCode::Volcengine => new VLMVolcengineProvider(),
                ServiceProviderCode::TTAPI => new TTAPIProvider(),
                ServiceProviderCode::MiracleVision => new MiracleVisionProvider(),
                default => throw new Exception('Invalid service provider code for VLM category'),
            },
            default => throw new Exception('Invalid service provider category'),
        };
    }
}
