<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\CloudFile\Kernel\Driver\TOS;

use DateTime;
use Dtyq\CloudFile\Kernel\Driver\ExpandInterface;
use Dtyq\CloudFile\Kernel\Exceptions\CloudFileException;
use Dtyq\CloudFile\Kernel\Struct\CredentialPolicy;
use Dtyq\CloudFile\Kernel\Struct\FileLink;
use Dtyq\CloudFile\Kernel\Utils\EasyFileTools;
use League\Flysystem\FileAttributes;
use Tos\Config\ConfigParser;
use Tos\Model\CopyObjectInput;
use Tos\Model\DeleteObjectInput;
use Tos\Model\Enum;
use Tos\Model\HeadObjectInput;
use Tos\Model\PreSignedURLInput;
use Tos\TosClient;
use Volc\Service\Sts;

class TOSExpand implements ExpandInterface
{
    private ConfigParser $configParser;

    private array $config;

    private TosClient $client;

    public function __construct(array $config = [])
    {
        $this->config = $config;
        $this->configParser = new ConfigParser($config);
        $this->client = new TosClient($this->configParser);
    }

    public function getUploadCredential(CredentialPolicy $credentialPolicy, array $options = []): array
    {
        return $credentialPolicy->isSts() ? $this->getUploadCredentialBySts($credentialPolicy) : $this->getUploadCredentialBySimple($credentialPolicy);
    }

    public function getPreSignedUrls(array $fileNames, int $expires = 3600, array $options = []): array
    {
        return [];
    }

    public function getMetas(array $paths, array $options = []): array
    {
        $list = [];
        foreach ($paths as $path) {
            $list[$path] = $this->getMeta($path);
        }
        return $list;
    }

    public function getFileLinks(array $paths, array $downloadNames = [], int $expires = 3600, array $options = []): array
    {
        $list = [];
        foreach ($paths as $path) {
            $url = $this->getPreSignedUrl($path, $expires, $options);
            $list[$path] = new FileLink($path, $url, $expires, '');
        }
        return $list;
    }

    public function destroy(array $paths, array $options = []): void
    {
        foreach ($paths as $path) {
            $this->client->deleteObject(new DeleteObjectInput($this->getBucket(), $path));
        }
    }

    public function duplicate(string $source, string $destination, array $options = []): string
    {
        $input = new CopyObjectInput($this->getBucket(), $destination, $this->getBucket(), $source);
        // 简易的配置添加方式
        foreach ($options['methods'] ?? [] as $method => $value) {
            if (method_exists($input, $method)) {
                $input->{$method}($value);
            }
        }
        $this->client->copyObject($input);
        return $destination;
    }

    private function getMeta(string $path): FileAttributes
    {
        $output = $this->client->headObject(new HeadObjectInput($this->getBucket(), $path));

        return new FileAttributes(
            $path,
            $output->getContentLength(),
            null,
            $output->getLastModified(),
            $output->getContentType()
        );
    }

    /**
     * @see https://www.volcengine.com/docs/6349/156107
     * 最大7天
     */
    private function getPreSignedUrl(string $path, int $expires = 3600, array $options = []): string
    {
        $input = new PreSignedURLInput(Enum::HttpMethodGet, $this->getBucket(), $path);
        $input->setExpires($expires);
        // 图片处理
        if (EasyFileTools::isImage($path) && ! empty($options['image']['process'])) {
            $query = [
                'x-tos-process' => $options['image']['process'],
            ];
            $input->setQuery($query);
        }
        return $this->client->preSignedURL($input)->getSignedUrl();
    }

    private function getUploadCredentialBySimple(CredentialPolicy $credentialPolicy): array
    {
        $expires = $credentialPolicy->getExpires();

        $now = new DateTime();
        $end = $now->modify("+{$expires} seconds");

        $expiration = str_replace(' ', 'T', $end->format('Y-m-d H:i:s')) . '.000Z';
        $serverSideEncryption = 'AES256';
        $algorithm = 'TOS4-HMAC-SHA256';
        $date = $end->format('Ymd\THis\Z');
        $credential = "{$this->configParser->getAk()}/{$end->format('Ymd')}/{$this->configParser->getRegion()}/tos/request";
        $conditions = [
            [
                'bucket' => $this->getBucket(),
            ],
            [
                'x-tos-server-side-encryption' => $serverSideEncryption,
            ],
            [
                'x-tos-credential' => $credential,
            ],
            [
                'x-tos-algorithm' => $algorithm,
            ],
            [
                'x-tos-date' => $date,
            ],
        ];
        $conditions[] = ['starts-with', '$key', $credentialPolicy->getDir()];
        if ($credentialPolicy->getContentType()) {
            $conditions[] = ['starts-with', '$Content-Type', $credentialPolicy->getContentType()];
        }

        $base64policy = base64_encode(json_encode(['expiration' => $expiration, 'conditions' => $conditions]));

        $dateKey = hash_hmac('sha256', $end->format('Ymd'), $this->configParser->getSk(), true);
        $regionKey = hash_hmac('sha256', $this->configParser->getRegion(), $dateKey, true);
        $serviceKey = hash_hmac('sha256', 'tos', $regionKey, true);
        $signingKey = hash_hmac('sha256', 'request', $serviceKey, true);
        $signature = hash_hmac('sha256', $base64policy, $signingKey);

        $callback = '';

        return [
            'host' => $this->configParser->getEndpoint($this->getBucket()),
            'x-tos-algorithm' => $algorithm,
            'x-tos-date' => $date,
            'x-tos-credential' => $credential,
            'x-tos-signature' => $signature,
            'x-tos-server-side-encryption' => $serverSideEncryption,
            'policy' => $base64policy,
            'expires' => $end->getTimestamp(),
            'dir' => $credentialPolicy->getDir(),
            'content_type' => $credentialPolicy->getContentType(),
            'x-tos-callback' => $callback,
        ];
    }

    /**
     * @see https://www.volcengine.com/docs/6349/127695
     */
    private function getUploadCredentialBySts(CredentialPolicy $credentialPolicy): array
    {
        if (empty($this->getTrn())) {
            throw new CloudFileException('未配置 trn');
        }
        $roleSessionName = $credentialPolicy->getRoleSessionName() ?: uniqid('easy_file_');

        $expires = $credentialPolicy->getExpires();

        // 目录限制
        $resource = "{$this->getBucket()}/";
        if (! empty($credentialPolicy->getDir())) {
            $resource = $resource . $credentialPolicy->getDir();
        }

        // 限制上传策略
        $stsPolicy = [
            'Statement' => [
                [
                    'Action' => [
                        'tos:PutObject',
                        'tos:GetObject',
                        'tos:AbortMultipartUpload',
                        'tos:ListMultipartUploadParts',
                        'tos:GetObjectVersion',
                    ],
                    'Resource' => [
                        "trn:tos:::{$resource}*",
                    ],
                    'Effect' => 'Allow',
                ],
            ],
        ];

        $query = [
            'query' => [
                'DurationSeconds' => $expires,
                'RoleSessionName' => $roleSessionName,
                'RoleTrn' => $this->getTrn(),
                'Policy' => json_encode($stsPolicy),
            ],
        ];

        $callback = '';

        $client = Sts::getInstance();
        $client->setAccessKey($this->configParser->getAk());
        $client->setSecretKey($this->configParser->getSk());
        $body = $client->assumeRole($query)->getContents();
        $data = json_decode($body, true);
        if (empty($data['Result']['Credentials'])) {
            throw new CloudFileException('获取 STS 失败');
        }

        return [
            'host' => $this->configParser->getEndpoint($this->getBucket()),
            'region' => $this->configParser->getRegion(),
            'endpoint' => $this->configParser->getEndpoint(),
            'credentials' => $data['Result']['Credentials'],
            'bucket' => $this->getBucket(),
            'dir' => $policy['dir'] ?? '',
            'expires' => $expires,
            'callback' => $callback,
        ];
    }

    private function getBucket(): string
    {
        return $this->config['bucket'] ?? '';
    }

    private function getTrn(): string
    {
        return $this->config['trn'] ?? '';
    }
}
