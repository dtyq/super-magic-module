<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\ExternalAPI\Search;

use GuzzleHttp\Client;
use Hyperf\Contract\ConfigInterface;
use RuntimeException;

class TavilySearch
{
    protected const API_URL = 'https://api.tavily.com';

    protected Client $client;

    protected array $apiKeys;

    public function __construct(Client $client, ConfigInterface $config)
    {
        $this->client = $client;
        $apiKey = $config->get('search.tavily.api_key');
        $this->apiKeys = explode(',', $apiKey);
    }

    public function results(
        string $query,
        int $maxResults = 5,
        string $searchDepth = 'basic',
        $includeAnswer = false
    ): array {
        return $this->rawResults($query, $maxResults, $searchDepth, includeAnswer: $includeAnswer);
    }

    protected function rawResults(
        string $query,
        int $maxResults = 5,
        string $searchDepth = 'basic',
        array $includeDomains = [],
        array $excludeDomains = [],
        bool $includeAnswer = false,
        bool $includeRawContent = false,
        bool $includeImages = false
    ): array {
        // 如果 $query 的长度小于 5，用省略号填充到 5
        if (mb_strlen($query) < 5) {
            $query = mb_str_pad($query, 6, '.');
        }
        $uri = self::API_URL . '/search';
        $randApiKey = $this->apiKeys[array_rand($this->apiKeys)];
        $response = $this->client->post($uri, [
            'json' => [
                'api_key' => $randApiKey,
                'query' => $query,
                'max_results' => $maxResults,
                'search_depth' => $searchDepth,
                'include_domains' => $includeDomains,
                'exclude_domains' => $excludeDomains,
                'include_answer' => $includeAnswer,
                'include_raw_content' => $includeRawContent,
                'include_images' => $includeImages,
            ],
            'verify' => false,
        ]);
        if ($response->getStatusCode() !== 200) {
            throw new RuntimeException('Failed to fetch results from Tavily Search API with status code ' . $response->getStatusCode());
        }
        return json_decode($response->getBody()->getContents(), true);
    }
}
