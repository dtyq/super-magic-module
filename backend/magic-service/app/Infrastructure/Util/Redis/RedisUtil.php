<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\Util\Redis;

use Hyperf\Redis\Redis;

class RedisUtil
{
    /**
     * 使用SCAN命令替代KEYS命令，返回匹配模式的所有键.
     *
     * @param string $pattern 匹配模式 (例如: 'user:*')
     * @param int $count 每次 SCAN 返回的元素数量 (可选，默认为 100)
     * @return array 匹配模式的所有键
     */
    public static function scanKeys(string $pattern, int $count = 100): array
    {
        $redis = di(Redis::class);
        $keys = [];
        $iterator = null; // PhpRedis 使用 null 作为初始迭代器
        while (false !== ($batchKeys = $redis->scan($iterator, $pattern, $count))) {
            if ($batchKeys !== false) {
                $keys[] = $batchKeys;
            }
        }
        ! empty($keys) && $keys = array_merge(...$keys);
        return $keys;
    }
}
