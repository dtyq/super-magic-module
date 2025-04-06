<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\Core\Traits;

use Psr\Cache\CacheItemPoolInterface;
use Symfony\Component\Cache\Adapter\ArrayAdapter;
use Throwable;

trait MagicCacheTrait
{
    /**
     * 缓存对象属性的下划线和驼峰命名，避免频繁计算.
     */
    protected static ?CacheItemPoolInterface $propertyKeyCache = null;

    /**
     * 获取缓存池实例.
     */
    protected function getCachePool(): ?CacheItemPoolInterface
    {
        if (self::$propertyKeyCache === null) {
            self::$propertyKeyCache = new ArrayAdapter(0, true, 0, 1000);
        }
        return self::$propertyKeyCache;
    }

    /**
     * 类的属性在框架运行时是不变的，所以这里使用缓存，避免重复计算.
     * 如果hasContainer是 false，则说明没有使用容器，不查询缓存.
     */
    protected function getUnCamelizeValueFromCache(string $key): string
    {
        $cachePool = $this->getCachePool();
        if ($cachePool === null) {
            return un_camelize($key);
        }

        $cacheKey = 'function_un_camelize_' . $key;
        try {
            $cacheItem = $cachePool->getItem($cacheKey);
            if ($cacheItem->isHit()) {
                return $cacheItem->get();
            }

            $value = un_camelize($key);
            $cacheItem->set($value);
            $cachePool->save($cacheItem);

            return $value;
        } catch (Throwable $exception) {
            echo 'error:getCamelizeValueFromCache:' . $exception->getMessage();
            return un_camelize($key);
        }
    }

    /**
     * 类的属性在框架运行时是不变的，所以这里使用缓存，避免重复计算.
     */
    protected function getCamelizeValueFromCache(string $key): string
    {
        $cachePool = $this->getCachePool();
        if ($cachePool === null) {
            return camelize($key);
        }

        $cacheKey = 'function_camelize_' . $key;
        try {
            $cacheItem = $cachePool->getItem($cacheKey);
            if ($cacheItem->isHit()) {
                return $cacheItem->get();
            }
            $value = camelize($key);
            $cacheItem->set($value);
            $cachePool->save($cacheItem);
            return $value;
        } catch (Throwable $exception) {
            echo 'error:getCamelizeValueFromCache:' . $exception->getMessage();
            return camelize($key);
        }
    }
}
