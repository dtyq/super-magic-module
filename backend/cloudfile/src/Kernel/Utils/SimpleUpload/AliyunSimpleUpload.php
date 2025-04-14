<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\CloudFile\Kernel\Utils\SimpleUpload;

use Dtyq\CloudFile\Kernel\Exceptions\CloudFileException;
use Dtyq\CloudFile\Kernel\Struct\AppendUploadFile;
use Dtyq\CloudFile\Kernel\Struct\UploadFile;
use Dtyq\CloudFile\Kernel\Utils\CurlHelper;
use Dtyq\CloudFile\Kernel\Utils\SimpleUpload;
use Throwable;

class AliyunSimpleUpload extends SimpleUpload
{
    private array $signKeyList = [
        'acl', 'uploads', 'location', 'cors',
        'logging', 'website', 'referer', 'lifecycle',
        'delete', 'append', 'tagging', 'objectMeta',
        'uploadId', 'partNumber', 'security-token', 'x-oss-security-token',
        'position', 'img', 'style', 'styleName',
        'replication', 'replicationProgress',
        'replicationLocation', 'cname', 'bucketInfo',
        'comp', 'qos', 'live', 'status', 'vod',
        'startTime', 'endTime', 'symlink',
        'x-oss-process', 'response-content-type', 'x-oss-traffic-limit',
        'response-content-language', 'response-expires',
        'response-cache-control', 'response-content-disposition',
        'response-content-encoding', 'udf', 'udfName', 'udfImage',
        'udfId', 'udfImageDesc', 'udfApplication',
        'udfApplicationLog', 'restore', 'callback', 'callback-var', 'qosInfo',
        'policy', 'stat', 'encryption', 'versions', 'versioning', 'versionId', 'requestPayment',
        'x-oss-request-payer', 'sequential',
        'inventory', 'inventoryId', 'continuation-token', 'asyncFetch',
        'worm', 'wormId', 'wormExtend', 'withHashContext',
        'x-oss-enable-md5', 'x-oss-enable-sha1', 'x-oss-enable-sha256',
        'x-oss-hash-ctx', 'x-oss-md5-ctx', 'transferAcceleration',
        'regionList', 'cloudboxes', 'x-oss-ac-source-ip', 'x-oss-ac-subnet-mask', 'x-oss-ac-vpc-id', 'x-oss-ac-forward-allow',
        'metaQuery', 'resourceGroup', 'rtc', 'x-oss-async-process', 'responseHeader',
    ];

    /**
     * @see https://help.aliyun.com/document_detail/31926.html
     */
    public function uploadObject(array $credential, UploadFile $uploadFile): void
    {
        if (isset($credential['temporary_credential'])) {
            $credential = $credential['temporary_credential'];
        }
        // 检查必填参数
        if (! isset($credential['host']) || ! isset($credential['dir']) || ! isset($credential['policy']) || ! isset($credential['accessid']) || ! isset($credential['signature'])) {
            throw new CloudFileException('Oss upload credential is invalid');
        }
        $key = $credential['dir'] . $uploadFile->getKeyPath();

        $body = [
            'key' => $key,
            'policy' => $credential['policy'],
            'OSSAccessKeyId' => $credential['accessid'],
            'success_action_status' => 200,
            'signature' => $credential['signature'],
            'callback' => '',
            'file' => curl_file_create($uploadFile->getRealPath(), $uploadFile->getMimeType(), $uploadFile->getName()),
        ];
        try {
            CurlHelper::sendRequest($credential['host'], $body, ['Content-Type' => 'multipart/form-data'], 200);
        } catch (Throwable $exception) {
            $errorMsg = $exception->getMessage();
            throw $exception;
        } finally {
            if (isset($errorMsg)) {
                $this->sdkContainer->getLogger()->warning('simple_upload_fail', ['key' => $key, 'host' => $credential['host'], 'error_msg' => $errorMsg]);
            } else {
                $this->sdkContainer->getLogger()->info('simple_upload_success', ['key' => $key, 'host' => $credential['host']]);
            }
        }
        $uploadFile->setKey($key);
    }

    /**
     * @see https://help.aliyun.com/zh/oss/developer-reference/appendobject
     */
    public function appendUploadObject(array $credential, AppendUploadFile $appendUploadFile): void
    {
        $object = $credential['dir'] . $appendUploadFile->getKeyPath();

        // 检查必填参数
        if (! isset($credential['host']) || ! isset($credential['dir']) || ! isset($credential['access_key_id']) || ! isset($credential['access_key_secret'])) {
            throw new CloudFileException('Oss upload credential is invalid');
        }

        // 先获取文件
        $key = $credential['dir'] . $appendUploadFile->getKeyPath();

        try {
            $fileContent = file_get_contents($appendUploadFile->getRealPath());
            if ($fileContent === false) {
                throw new CloudFileException('读取文件失败：' . $appendUploadFile->getRealPath());
            }

            $contentType = mime_content_type($appendUploadFile->getRealPath());
            $date = gmdate('D, d M Y H:i:s \G\M\T');

            $headers = [
                'Host' => parse_url($credential['host'])['host'] ?? '',
                'Content-Type' => $contentType,
                'Content-Length' => strlen($fileContent),
                'Content-Md5' => base64_encode(md5($fileContent, true)),
                'x-oss-security-token' => $credential['sts_token'],
                'Date' => $date,
            ];

            $stringToSign = $this->aliyunCalcStringToSign('POST', $date, $headers, '/' . $credential['bucket'] . '/' . $key, [
                'append' => '',
                'position' => (string) $appendUploadFile->getPosition(),
            ]);
            $signature = base64_encode(hash_hmac('sha1', $stringToSign, $credential['access_key_secret'], true));
            $headers['Authorization'] = 'OSS ' . $credential['access_key_id'] . ':' . $signature;

            $body = file_get_contents($appendUploadFile->getRealPath());

            $url = $credential['host'] . '/' . $object . '?append&position=' . $appendUploadFile->getPosition();
            CurlHelper::sendRequest($url, $body, $headers, 200);
        } catch (Throwable $exception) {
            $errorMsg = $exception->getMessage();
            throw $exception;
        } finally {
            if (isset($errorMsg)) {
                $this->sdkContainer->getLogger()->warning('simple_upload_fail', ['key' => $key, 'host' => $credential['host'], 'error_msg' => $errorMsg]);
            } else {
                $this->sdkContainer->getLogger()->info('simple_upload_success', ['key' => $key, 'host' => $credential['host']]);
            }
        }
        $appendUploadFile->setKey($key);
        $appendUploadFile->setPosition($appendUploadFile->getPosition() + $appendUploadFile->getSize());
    }

    private function aliyunCalcStringToSign($method, $date, array $headers, $resourcePath, array $query): string
    {
        /*
        SignToString =
            VERB + "\n"
            + Content-MD5 + "\n"
            + Content-Type + "\n"
            + Date + "\n"
            + CanonicalizedOSSHeaders
            + CanonicalizedResource
        Signature = base64(hmac-sha1(AccessKeySecret, SignToString))
        */
        $contentMd5 = '';
        $contentType = '';
        // CanonicalizedOSSHeaders
        $signheaders = [];
        foreach ($headers as $key => $value) {
            $lowk = strtolower($key);
            if (strncmp($lowk, 'x-oss-', 6) == 0) {
                $signheaders[$lowk] = $value;
            } elseif ($lowk === 'content-md5') {
                $contentMd5 = $value;
            } elseif ($lowk === 'content-type') {
                $contentType = $value;
            }
        }
        ksort($signheaders);
        $canonicalizedOSSHeaders = '';
        foreach ($signheaders as $key => $value) {
            $canonicalizedOSSHeaders .= $key . ':' . $value . "\n";
        }
        // CanonicalizedResource
        $signquery = [];
        foreach ($query as $key => $value) {
            if (in_array($key, $this->signKeyList)) {
                $signquery[$key] = $value;
            }
        }
        ksort($signquery);
        $sortedQueryList = [];
        foreach ($signquery as $key => $value) {
            if (strlen($value) > 0) {
                $sortedQueryList[] = $key . '=' . $value;
            } else {
                $sortedQueryList[] = $key;
            }
        }
        $queryStringSorted = implode('&', $sortedQueryList);
        $canonicalizedResource = $resourcePath;
        if (! empty($queryStringSorted)) {
            $canonicalizedResource .= '?' . $queryStringSorted;
        }
        return $method . "\n" . $contentMd5 . "\n" . $contentType . "\n" . $date . "\n" . $canonicalizedOSSHeaders . $canonicalizedResource;
    }
}
