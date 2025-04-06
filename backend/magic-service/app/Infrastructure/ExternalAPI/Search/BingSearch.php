<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\ExternalAPI\Search;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use Hyperf\Contract\ConfigInterface;
use Hyperf\Contract\StdoutLoggerInterface;
use RuntimeException;

class BingSearch
{
    private const string BING_SEARCH_V7_ENDPOINT = 'https://api.bing.microsoft.com/v7.0/search';

    private const int DEFAULT_SEARCH_ENGINE_TIMEOUT = 5;

    public function __construct(protected readonly StdoutLoggerInterface $logger, protected readonly ConfigInterface $config)
    {
    }

    public function search(string $query, string $subscriptionKey, string $mkt): array
    {
        /*
         * 使用 bing 搜索并返回上下文。
         */

        // 创建 Guzzle 客户端
        $client = new Client([
            'base_uri' => self::BING_SEARCH_V7_ENDPOINT,
            'timeout' => self::DEFAULT_SEARCH_ENGINE_TIMEOUT,
            'headers' => [
                'Ocp-Apim-Subscription-Key' => $subscriptionKey,
                'Accept-Language' => $mkt,
            ],
        ]);

        try {
            // 发送 GET 请求
            $response = $client->request('GET', '', [
                'query' => [
                    'q' => $query,
                    'mkt' => $mkt,
                    'count' => 20,
                    'offset' => 0,
                ],
            ]);

            // 获取响应体内容
            $body = $response->getBody()->getContents();

            // 如果需要将 JSON 转换为数组或对象，可以使用 json_decode
            $data = json_decode($body, true);
        } catch (RequestException $e) {
            // 如果有响应，可以获取响应状态码和内容
            if ($e->hasResponse()) {
                $statusCode = $e->getResponse()->getStatusCode();
                $reason = $e->getResponse()->getReasonPhrase();
                $responseBody = $e->getResponse()->getBody()->getContents();
                error_log("HTTP {$statusCode} {$reason}: {$responseBody}");
            } else {
                // 如果没有响应，如网络错误
                error_log($e->getMessage());
            }

            throw new RuntimeException('Search engine error.');
        }

        return $data;
    }
}
