<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */
use function Hyperf\Support\env;

/*
 * 本文件属于灯塔引擎版权所有，泄漏必究。
 */
return [
    // 默认的 magic_environment 环境 id
    'default_magic_environment_id' => env('MAGIC_ENV_ID', 1),
    'host' => env('KK_OPEN_PLATFORM_ADDRESS'),

    'app_code' => env('APP_CODE', ''),

    'oidc_config_configuration' => env('KK_OPEN_PLATFORM_OIDC_CONFIG_CONFIGURATION', ''),

    'accounts' => [
        'magic' => [
            'client_id' => env('KK_OPEN_PLATFORM_MAGIC_CLIENT_ID', ''),
            'client_secret' => env('KK_OPEN_PLATFORM_MAGIC_CLIENT_SECRET', ''),
        ],
    ],
];
