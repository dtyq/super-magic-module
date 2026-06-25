<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Application\SuperAgent\Service;

use DateTimeImmutable;
use Psr\SimpleCache\CacheInterface;
use Qbhy\HyperfAuth\Authenticatable;

use function Hyperf\Support\env;

/**
 * OAuth2 回调中转应用服务。
 */
class OAuth2CallbackRelayAppService
{
    private const string CACHE_KEY_PREFIX = 'super_agent:oauth2:callback_relay:';

    public function __construct(
        private readonly CacheInterface $cache,
    ) {
    }

    /**
     * 保存第三方 OAuth2 provider 回调参数。
     */
    public function saveCallback(array $query): array
    {
        $state = trim((string) ($query['state'] ?? ''));
        if ($state === '') {
            return $this->failed('state is required');
        }

        $payload = [
            'state' => $state,
            'code' => (string) ($query['code'] ?? ''),
            'error' => (string) ($query['error'] ?? ''),
            'error_description' => (string) ($query['error_description'] ?? ''),
            'received_at' => (new DateTimeImmutable())->format('Y-m-d H:i:s'),
            'source' => 'magic_service',
        ];

        if ($payload['code'] === '' && $payload['error'] === '') {
            return $this->failed('code or error is required');
        }

        $this->cache->set($this->getCacheKey($state), $payload, $this->getTtl());

        return [
            'status' => 'received',
            'payload' => $payload,
            'message' => '',
        ];
    }

    /**
     * 按 state 获取已暂存的 OAuth2 callback payload。
     */
    public function fetchCallback(Authenticatable $authorization, string $state): array
    {
        $state = trim($state);
        if ($state === '') {
            return $this->failed('state is required');
        }

        $payload = $this->cache->get($this->getCacheKey($state));
        if (! is_array($payload)) {
            return [
                'status' => 'pending',
                'payload' => null,
                'message' => 'Callback has not arrived.',
            ];
        }

        return [
            'status' => 'received',
            'payload' => $payload,
            'message' => '',
        ];
    }

    /**
     * 删除已消费的 OAuth2 callback payload。
     */
    public function deleteCallback(Authenticatable $authorization, string $state): array
    {
        $state = trim($state);
        if ($state === '') {
            return $this->failed('state is required');
        }

        $deleted = $this->cache->delete($this->getCacheKey($state));

        return [
            'status' => 'deleted',
            'payload' => null,
            'message' => '',
            'deleted' => $deleted,
        ];
    }

    /**
     * 生成 callback payload 缓存 key。
     */
    private function getCacheKey(string $state): string
    {
        return self::CACHE_KEY_PREFIX . hash('sha256', $state);
    }

    /**
     * 获取 callback payload 暂存 TTL。
     */
    private function getTtl(): int
    {
        $ttl = (int) env('OAUTH2_CALLBACK_RELAY_TTL', 600);
        return $ttl > 0 ? $ttl : 600;
    }

    /**
     * 生成失败状态响应。
     */
    private function failed(string $message): array
    {
        return [
            'status' => 'failed',
            'payload' => null,
            'message' => $message,
        ];
    }
}
