<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */
use App\Domain\ModelGateway\Entity\ValueObject\MagicApiLLMEnum;
use Hyperf\Odin\Model\OpenAIModel;

use function Hyperf\Support\env;

return [
    // rpm配置
    'rpm_config' => [
        // 组织RPM限流
        'organization' => 1000,
        // 用户限流
        'user' => 100,
        // 应用限流
        'app' => 100,
    ],
    // 默认额度配置
    'default_amount_config' => [
        // 组织默认额度
        'organization' => 500000,
        // 个人默认额度
        'user' => 1000,
    ],
    // 访问国外的代理配置
    'http' => [
        'proxy' => env('HTTP_PROXY'),
    ],
    'default_access_token' => env('MAGIC_API_DEFAULT_ACCESS_TOKEN'),
    'llm' => [
        'models' => [
            MagicApiLLMEnum::LOCAL_GEMMA2_2B->value => [
                'implementation' => OpenAIModel::class,
                'model' => env('LOCAL_GEMMA2_MODEL_ID', 'shareAI/gemma-2-2b-it-Chinese-DPO-GGUF'),
                'config' => [
                    'base_url' => env('CLOSEDAI_API', ''),
                    'api_key' => env('CLOSEDAI_TOKEN', ''),
                ],
            ],
        ],
    ],
];
