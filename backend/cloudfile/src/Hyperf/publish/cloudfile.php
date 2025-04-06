<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */
return [
    'storages' => [
        'file_service' => [
            'adapter' => 'file_service',
            'config' => [
                'host' => '',
                'platform' => '',
                'key' => '',
            ],
        ],
        'aliyun' => [
            'adapter' => 'aliyun',
            'config' => [
                'accessId' => '',
                'accessSecret' => '',
                'bucket' => '',
                'endpoint' => '',
                'role_arn' => '',
            ],
        ],
        'tos' => [
            'adapter' => 'tos',
            'config' => [
                'region' => '',
                'endpoint' => '',
                'ak' => '',
                'sk' => '',
                'bucket' => '',
                'trn' => '',
            ],
        ],
    ],
];
