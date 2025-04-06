<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */
return [
    // 重试配置
    'retry' => [
        // 重试间隔 秒
        'interval' => 600,
        // 重试最大次数

        'times' => 3,
    ],

    // 最大重试后的回调，如可以发送钉钉消息
    'max_retry_callback' => [null],

    // 协程上下文复制keys
    'context_copy_keys' => ['request-id'],

    // 是否清理历史事件
    'clear_history' => env('ASYNC_EVENT_CLEAR_HISTORY', true),
];
