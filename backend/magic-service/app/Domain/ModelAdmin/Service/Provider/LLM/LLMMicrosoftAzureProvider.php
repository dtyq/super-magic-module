<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\ModelAdmin\Service\Provider\LLM;

use App\Domain\ModelAdmin\Entity\ServiceProviderEntity;
use App\Domain\ModelAdmin\Entity\ValueObject\ServiceProviderConfig;
use App\Domain\ModelAdmin\Service\Provider\ConnectResponse;
use App\Domain\ModelAdmin\Service\Provider\IProvider;
use App\ErrorCode\ServiceProviderErrorCode;
use App\Infrastructure\Core\Exception\ExceptionBuilder;
use Exception;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\ClientException;
use GuzzleHttp\Exception\ConnectException;
use Hyperf\Codec\Json;
use JetBrains\PhpStorm\Deprecated;

class LLMMicrosoftAzureProvider implements IProvider
{
    public function __construct()
    {
    }

    public function getModels(ServiceProviderEntity $serviceProviderEntity): array
    {
        // 通过API获取可用模型
        return $this->fetchModels();
    }

    public function connectivityTestByModel(ServiceProviderConfig $serviceProviderConfig, string $modelVersion): ConnectResponse
    {
        $connectResponse = new ConnectResponse();
        try {
            $apiKey = $serviceProviderConfig->getApiKey();
            $apiBase = $serviceProviderConfig->getUrl();
            $apiVersion = $serviceProviderConfig->getApiVersion();

            $client = new Client();

            $client->request('GET', rtrim('https://' . $apiBase, '/') . '/openai/models', [
                'headers' => [
                    'api-key' => $apiKey,
                    'Content-Type' => 'application/json',
                ],
                'query' => [
                    'api-version' => $apiVersion,
                ],
            ]);
        } catch (ClientException|ConnectException|Exception $e) {
            // 判断各类型特殊取值
            if ($e instanceof ClientException) {
                $connectResponse->setStatus(false);
                $connectResponse->setMessage($e->getResponse()->getBody()->getContents());
            } else {
                $connectResponse->setMessage($e->getMessage());
            }
            $connectResponse->setStatus(false);
            return $connectResponse;
        }
        return $connectResponse;
    }

    /**
     * 从Azure OpenAI API获取可用模型
     * 根据官方文档: https://learn.microsoft.com/zh-cn/rest/api/azureopenai/models/list.
     * @return array 模型列表
     */
    #[Deprecated]
    private function fetchModels(): array
    {
        $models = [];
        try {
            // 创建HTTP客户端
            $client = new Client();

            // 根据官方文档，正确的端点是/openai/models
            $response = $client->request('GET', rtrim('https://' . $this->apiBase, '/') . '/openai/models', [
                'headers' => [
                    'api-key' => $this->apiKey,
                    'Content-Type' => 'application/json',
                ],
                'query' => [
                    'api-version' => $this->apiVersion,
                ],
            ]);

            $statusCode = $response->getStatusCode();
            if ($statusCode !== 200) {
                $this->logger->warning('调用 Microsoft Azure 模型列表 API 失败 ：' . $response->getBody()->getContents());
                ExceptionBuilder::throw(ServiceProviderErrorCode::SystemError, '获取模型列表失败');
            }

            $responseBody = $response->getBody()->getContents();
            $result = Json::decode($responseBody, true);

            // 根据文档，响应格式是 { "data": [...], "object": "list" }
            $modelResult = $result['data'] ?? [];
            foreach ($modelResult as $model) {
                if (
                    isset($model['capabilities']['chat_completion'])
                    && $model['capabilities']['chat_completion']
                    && isset($model['status'])
                    && $model['status'] === 'succeeded'
                ) {
                    $models[] = $model;
                }
            }
        } catch (Exception $exception) {
            $this->logger->warning('调用 Microsoft Azure 模型列表 API 失败 ：' . $exception->getMessage());
            ExceptionBuilder::throw(ServiceProviderErrorCode::SystemError, '获取模型列表失败');
        }
        return $models;
    }
}
