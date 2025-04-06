<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\ModelAdmin\Service\Provider\LLM;

use App\Domain\ModelAdmin\Constant\ModelType;
use App\Domain\ModelAdmin\Constant\ServiceProviderCategory;
use App\Domain\ModelAdmin\Entity\ServiceProviderEntity;
use App\Domain\ModelAdmin\Entity\ServiceProviderModelsEntity;
use App\Domain\ModelAdmin\Entity\ValueObject\ServiceProviderConfig;
use App\Domain\ModelAdmin\Service\Provider\ConnectResponse;
use App\Domain\ModelAdmin\Service\Provider\IProvider;
use Exception;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\ClientException;
use GuzzleHttp\Exception\ConnectException;
use Hyperf\Codec\Json;
use Psr\Http\Message\ResponseInterface;

use function Hyperf\Translation\__;

/**
 * 火山服务商.
 */
class LLMVolcengineProvider implements IProvider
{
    //    private static string $LLM = 'LLM';

    //    private static striang $Audio = 'Audio';
    //    private static string $Embedding = 'Embedding';

    private static string $ComputerVision = 'ComputerVision';

    private string $ak = '';

    private string $sk = '';

    private string $action = 'ListFoundationModels';

    private string $region = 'cn-beijing';

    private string $service = 'ark';

    private string $version = '2024-01-01';

    private string $host = 'open.volcengineapi.com';

    public function __construct()
    {
    }

    /**
     * 文档：@see https://www.volcengine.com/docs/82379/1257587.
     */
    public function getModels(ServiceProviderEntity $serviceProviderEntity): array
    {
        $body = Json::encode(['PageSize' => 100]);
        $response = $this->sendRequest('POST', [], [], $this->ak, $this->sk, $this->action, $body);
        // 解析response
        $responseBody = $response->getBody()->getContents();
        $responseBody = json_decode($responseBody, true);
        $items = $responseBody['Result']['Items'];
        $models = [];
        foreach ($items as $item) {
            if (! in_array(self::$ComputerVision, $item['FoundationModelTag']['Domains'])) {
                continue;
            }
            $serviceProviderModelsEntity = new ServiceProviderModelsEntity();
            $serviceProviderModelsEntity->setName($item['DisplayName']);
            $serviceProviderModelsEntity->setDescription($item['Description']);
            $serviceProviderModelsEntity->setModelVersion($item['Name'] . '-' . $item['PrimaryVersion']);
            $serviceProviderModelsEntity->setIcon($serviceProviderEntity->getIcon());
            $serviceProviderModelsEntity->setModelType(ModelType::LLM->value);
            $serviceProviderModelsEntity->setServiceProviderConfigId($serviceProviderEntity->getId());
            $serviceProviderModelsEntity->setCategory(ServiceProviderCategory::LLM->value);
            $serviceProviderModelsEntity->setConfig([]);
            $models[] = $serviceProviderModelsEntity;
        }

        return $models;
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
        $client = new Client();
        $payload = [
            'model' => $modelVersion,
            'messages' => [
                [
                    'role' => 'system',
                    'content' => 'You are a helpful assistant.',
                ],
                [
                    'role' => 'user',
                    'content' => 'Hello!',
                ],
            ],
        ];
        try {
            $client->request('POST', 'https://ark.cn-beijing.volces.com/api/v3/chat/completions', [
                'headers' => [
                    'Content-Type' => 'application/json',
                    'Authorization' => 'Bearer ' . $apiKey,
                ],
                'json' => $payload,
            ]);
        } catch (ClientException|ConnectException|Exception $e) {
            $connectResponse->setStatus(false);
            if ($e instanceof ConnectException || $e instanceof ClientException) {
                $connectResponse->setMessage(Json::decode($e->getResponse()->getBody()->getContents()));
            } else {
                $connectResponse->setMessage($e->getMessage());
            }
        }
        return $connectResponse;
    }

    protected function sendRequest(string $method, array $query, array $header, string $ak, string $sk, string $action, string $body): ResponseInterface
    {
        $Service = $this->service;
        $Version = $this->version;
        $Region = $this->region;
        $Host = $this->host;
        $ContentType = 'application/json';

        // 第二步：创建身份证明。其中的 Service 和 Region 字段是固定的。ak 和 sk 分别代表
        // AccessKeyID 和 SecretAccessKey。同时需要初始化签名结构体。一些签名计算时需要的属性也在这里处理。
        // 初始化身份证明结构体
        $credential = [
            'accessKeyId' => $ak,
            'secretKeyId' => $sk,
            'service' => $Service,
            'region' => $Region,
        ];

        // 初始化签名结构体
        $query = array_merge($query, [
            'Action' => $action,
            'Version' => $Version,
        ]);
        ksort($query);
        $requestParam = [
            // body是http请求需要的原生body
            'body' => $body,
            'host' => $Host,
            'path' => '/',
            'method' => $method,
            'contentType' => $ContentType,
            'date' => gmdate('Ymd\THis\Z'),
            'query' => $query,
        ];

        // 第三步：接下来开始计算签名。在计算签名前，先准备好用于接收签算结果的 signResult 变量，并设置一些参数。
        // 初始化签名结果的结构体
        $xDate = $requestParam['date'];
        $shortXDate = substr($xDate, 0, 8);
        $xContentSha256 = hash('sha256', $requestParam['body']);
        $signResult = [
            'Host' => $requestParam['host'],
            'X-Content-Sha256' => $xContentSha256,
            'X-Date' => $xDate,
            'Content-Type' => $requestParam['contentType'],
        ];
        // 第四步：计算 Signature 签名。
        $signedHeaderStr = join(';', ['content-type', 'host', 'x-content-sha256', 'x-date']);
        $canonicalRequestStr = join("\n", [
            $requestParam['method'],
            $requestParam['path'],
            http_build_query($requestParam['query']),
            join("\n", ['content-type:' . $requestParam['contentType'], 'host:' . $requestParam['host'], 'x-content-sha256:' . $xContentSha256, 'x-date:' . $xDate]),
            '',
            $signedHeaderStr,
            $xContentSha256,
        ]);
        $hashedCanonicalRequest = hash('sha256', $canonicalRequestStr);
        $credentialScope = join('/', [$shortXDate, $credential['region'], $credential['service'], 'request']);
        $stringToSign = join("\n", ['HMAC-SHA256', $xDate, $credentialScope, $hashedCanonicalRequest]);
        $kDate = hash_hmac('sha256', $shortXDate, $credential['secretKeyId'], true);
        $kRegion = hash_hmac('sha256', $credential['region'], $kDate, true);
        $kService = hash_hmac('sha256', $credential['service'], $kRegion, true);
        $kSigning = hash_hmac('sha256', 'request', $kService, true);
        $signature = hash_hmac('sha256', $stringToSign, $kSigning);
        $signResult['Authorization'] = sprintf('HMAC-SHA256 Credential=%s, SignedHeaders=%s, Signature=%s', $credential['accessKeyId'] . '/' . $credentialScope, $signedHeaderStr, $signature);
        $header = array_merge($header, $signResult);
        // 第五步：将 Signature 签名写入 HTTP Header 中，并发送 HTTP 请求。
        $client = new Client([
            'base_uri' => 'https://' . $requestParam['host'],
            'timeout' => 120.0,
        ]);
        return $client->request($method, 'https://' . $requestParam['host'] . $requestParam['path'], [
            'headers' => $header,
            'query' => $requestParam['query'],
            'body' => $requestParam['body'],
        ]);
    }
}
