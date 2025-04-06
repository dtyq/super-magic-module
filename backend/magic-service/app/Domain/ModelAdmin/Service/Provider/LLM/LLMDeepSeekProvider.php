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
use BadMethodCallException;
use Exception;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\ClientException;
use Hyperf\Codec\Json;
use JetBrains\PhpStorm\Deprecated;

use function Hyperf\Translation\__;

class LLMDeepSeekProvider implements IProvider
{
    protected string $apiBase = 'https://api.deepseek.com';

    #[Deprecated]
    public function getModels(ServiceProviderEntity $serviceProviderEntity): array
    {
        throw new BadMethodCallException();
    }

    public function connectivityTestByModel(ServiceProviderConfig $serviceProviderConfig, string $modelVersion): ConnectResponse
    {
        $connectResponse = new ConnectResponse();
        $connectResponse->setStatus(true);
        $apiKey = $serviceProviderConfig->getApiKey();
        if (empty($apiKey)) {
            $connectResponse->setStatus(false);
            $connectResponse->setMessage(__('service_provider.api_key_empty'));
            return $connectResponse;
        }
        try {
            $this->fetchModels($apiKey);
        } catch (Exception $e) {
            $connectResponse->setStatus(false);
            if ($e instanceof ClientException) {
                $connectResponse->setMessage(Json::decode($e->getResponse()->getBody()->getContents()));
            } else {
                $connectResponse->setMessage($e->getMessage());
            }
        }

        return $connectResponse;
    }

    protected function fetchModels(string $apiKey): array
    {
        $client = new Client();

        $response = $client->request('GET', $this->apiBase . '/models', [
            'headers' => [
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
            ],
        ]);

        return Json::decode($response->getBody()->getContents());
    }
}
