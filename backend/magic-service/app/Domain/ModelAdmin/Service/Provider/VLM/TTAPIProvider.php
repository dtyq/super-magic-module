<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\ModelAdmin\Service\Provider\VLM;

use App\Domain\ModelAdmin\Entity\ServiceProviderEntity;
use App\Domain\ModelAdmin\Entity\ValueObject\ServiceProviderConfig;
use App\Domain\ModelAdmin\Service\Provider\ConnectResponse;
use App\Domain\ModelAdmin\Service\Provider\IProvider;
use App\Infrastructure\ExternalAPI\ImageGenerateAPI\Model\Flux\FluxAPI;
use BadMethodCallException;
use Exception;
use GuzzleHttp\Exception\ClientException;
use Hyperf\Codec\Json;
use JetBrains\PhpStorm\Deprecated;

use function Hyperf\Translation\__;

class TTAPIProvider implements IProvider
{
    public function __construct()
    {
    }

    #[Deprecated]
    public function getModels(ServiceProviderEntity $serviceProviderEntity): array
    {
        throw new BadMethodCallException();
    }

    public function connectivityTestByModel(ServiceProviderConfig $serviceProviderConfig, string $modelVersion): ConnectResponse
    {
        $connectResponse = new ConnectResponse();
        $apiKey = $serviceProviderConfig->getApiKey();
        if (empty($apiKey)) {
            $connectResponse->setMessage(__('service_provider.api_key_empty'));
            $connectResponse->setStatus(false);
            return $connectResponse;
        }

        try {
            // TTAPI 任意测试即可，并且不需要生图，因为 VLM 的模型是超级管理员添加的，在使用前我们肯定测试成功
            // 所以只需要测试一个成本低的接口即可
            $fluxAPI = new FluxAPI($apiKey);
            $fluxAPI->getAccountInfo();
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
}
