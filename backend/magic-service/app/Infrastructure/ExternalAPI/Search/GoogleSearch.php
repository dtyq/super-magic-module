<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\ExternalAPI\Search;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\BadResponseException;
use GuzzleHttp\Exception\RequestException;
use Hyperf\Codec\Json;
use Hyperf\Contract\ConfigInterface;
use Hyperf\Contract\StdoutLoggerInterface;
use RuntimeException;
use Throwable;

class GoogleSearch
{
    private const string GOOGLE_SEARCH_ENDPOINT = 'https://www.googleapis.com/customsearch/v1';

    private const int DEFAULT_SEARCH_ENGINE_TIMEOUT = 5;

    private const int REFERENCE_COUNT = 8; // 替换为你需要的引用数量

    public function __construct(protected readonly StdoutLoggerInterface $logger, protected readonly ConfigInterface $config)
    {
    }

    public function search(string $query, string $subscriptionKey, string $cx): array
    {
        $client = new Client();
        $params = [
            'key' => $subscriptionKey,
            'cx' => $cx,
            'q' => $query,
            'num' => self::REFERENCE_COUNT,
        ];

        try {
            $options = [
                'query' => $params,
                'timeout' => self::DEFAULT_SEARCH_ENGINE_TIMEOUT,
            ];
            $proxy = $this->config->get('odin.http.proxy');
            if (! empty($proxy)) {
                $options['proxy'] = $proxy;
            }
            $response = $client->get(
                self::GOOGLE_SEARCH_ENDPOINT,
                $options
            );
            if ($response->getStatusCode() !== 200) {
                throw new RuntimeException('Search engine error: ' . $response->getBody());
            }

            $jsonContent = Json::decode($response->getBody()->getContents());
            $contexts = $jsonContent['items'] ?? [];
            return array_slice($contexts, 0, self::REFERENCE_COUNT);
        } catch (BadResponseException|RequestException $e) {
            // 记录错误日志
            $this->logger->error(sprintf(
                '谷歌搜索遇到错误:%s,file:%s,line:%s trace:%s, will generate again.',
                $e->getResponse()?->getBody(), /* @phpstan-ignore-line */
                $e->getFile(),
                $e->getLine(),
                $e->getTraceAsString()
            ));
            return [];
        } catch (Throwable$e) {
            $this->logger->error('谷歌搜索遇到错误:' . $e->getMessage());
        }
        return [];
    }
}
