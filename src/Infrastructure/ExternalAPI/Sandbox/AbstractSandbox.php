<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Infrastructure\ExternalAPI\Sandbox;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Hyperf\Logger\LoggerFactory;
use Psr\Log\LoggerInterface;
use RuntimeException;
use Throwable;

abstract class AbstractSandbox implements SandboxInterface
{
    protected Client $client;

    protected LoggerInterface $logger;

    protected string $baseUrl;

    protected string $token;

    protected bool $enableSandbox = false;

    public function __construct(protected LoggerFactory $loggerFactory)
    {
        $this->logger = $loggerFactory->get('sandbox');
        $this->initializeClient();
    }

    protected function initializeClient(): void
    {
        $this->baseUrl = env('SANDBOX_GATEWAY', '');
        $this->token = env('SANDBOX_TOKEN', '');
        $this->enableSandbox = env('SANDBOX_ENABLE', false);
        if (empty($this->baseUrl)) {
            throw new RuntimeException('SANDBOX_GATEWAY environment variable is not set');
        }

        // 确保 base_uri 以 http:// 或 https:// 开头
        if (! preg_match('~^https?://~i', $this->baseUrl)) {
            $this->baseUrl = 'http://' . $this->baseUrl;
        }

        // 确保 base_uri 以 / 结尾
        $this->baseUrl = rtrim($this->baseUrl, '/') . '/';

        $this->client = new Client([
            'base_uri' => $this->baseUrl,
            'timeout' => 30,
            'http_errors' => false,
        ]);
    }

    protected function handleResponse(string $action, $response): SandboxResult
    {
        try {
            $contents = $response->getBody()->getContents();
            $this->logger->info(sprintf(
                '[Sandbox] Raw response - action: %s, status_code: %d, contents: %s',
                $action,
                $response->getStatusCode(),
                $contents
            ));

            $body = json_decode($contents, true);
            $success = $response->getStatusCode() === 200 && ($body['code'] ?? 0) === 1000;
            $code = $body['code'] ?? 0;

            $rawData = $body['data'] ?? [];

            // 创建沙箱数据对象
            $sandboxData = SandboxData::fromArray($rawData);

            // 创建结果对象 - 只使用 SandboxData，移除冗余
            $result = new SandboxResult(
                $success,
                $success ? 'Success' : ($body['message'] ?? 'Unknown error'),
                $code,
                $sandboxData
            );

            $this->logger->info(sprintf(
                '[Sandbox] Parsed response - action: %s, success: %s, message: %s, data: %s, code: %d, sandbox_id: %s',
                $action,
                $result->isSuccess() ? 'true' : 'false',
                $result->getMessage(),
                json_encode($result->getSandboxData()->toArray(), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                $result->getCode(),
                $result->getSandboxData()->getSandboxId() ?? 'null'
            ));

            return $result;
        } catch (Throwable $e) {
            $this->logger->error(sprintf('[Sandbox] %s failed: %s', $action, $e->getMessage()));
            // 创建一个带错误消息的空结果
            return new SandboxResult(false, $e->getMessage());
        }
    }

    protected function request(string $method, string $uri, array $options = []): SandboxResult
    {
        try {
            $this->logger->info(sprintf(
                '[Sandbox] Making request - method: %s, uri: %s, options: %s, base_uri: %s',
                $method,
                $uri,
                json_encode($options, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                $this->baseUrl
            ));
            // 增加 token
            if (! empty($options['headers'])) {
                $options['headers']['token'] = $this->token;
            } else {
                $options['headers'] = ['token' => $this->token];
            }

            $response = $this->client->request($method, $uri, $options);
            return $this->handleResponse($uri, $response);
        } catch (GuzzleException $e) {
            $this->logger->error(sprintf('[Sandbox] Request failed: %s', $e->getMessage()));
            // 创建一个带错误消息的空结果
            return new SandboxResult(false, $e->getMessage());
        }
    }
}
