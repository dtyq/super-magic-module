<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */
use App\Infrastructure\Util\Asr\ValueObject\AsrPlatform;

use function Hyperf\Support\env;

return [
    'default_platform' => AsrPlatform::tryFrom(env('ASR_DEFAULT_PLATFORM', 'volcengine')),
    'volcengine' => [
        'app_id' => env('ASR_VKE_APP_ID', ''),
        'token' => env('ASR_VKE_TOKEN', ''),
        'cluster' => env('ASR_VKE_CLUSTER', ''),
        'hot_words' => json_decode(env('ASR_VKE_HOTWORDS_CONFIG') ?? '[]', true) ?: [],
        'replacement_words' => json_decode(env('ASR_VKE_REPLACEMENT_WORDS_CONFIG') ?? '[]', true) ?: [],
    ],
    'text_replacer' => [ // 目前火山大模型仅支持热词，不支持替换，用于极端情况下备用
        'fuzz' => [
            'replacement' => [
            ],
            'threshold' => 70,
        ],
    ],
];
