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

class TosSimpleUpload extends SimpleUpload
{
    public function uploadObject(array $credential, UploadFile $uploadFile): void
    {
        if (isset($credential['temporary_credential'])) {
            $credential = $credential['temporary_credential'];
        }
        if (! isset($credential['dir']) || ! isset($credential['policy']) || ! isset($credential['x-tos-server-side-encryption']) || ! isset($credential['x-tos-algorithm']) || ! isset($credential['x-tos-date']) || ! isset($credential['x-tos-credential']) || ! isset($credential['x-tos-signature'])) {
            throw new CloudFileException('Tos upload credential is invalid');
        }

        $key = $credential['dir'] . $uploadFile->getKeyPath();
        $body = [
            'key' => $key,
        ];
        if (! empty($credential['content_type'])) {
            $body['Content-Type'] = $credential['content_type'];
        }
        $body['x-tos-server-side-encryption'] = $credential['x-tos-server-side-encryption'];
        $body['x-tos-algorithm'] = $credential['x-tos-algorithm'];
        $body['x-tos-date'] = $credential['x-tos-date'];
        $body['x-tos-credential'] = $credential['x-tos-credential'];
        $body['policy'] = $credential['policy'];
        $body['x-tos-signature'] = $credential['x-tos-signature'];
        $body['file'] = curl_file_create($uploadFile->getRealPath(), $uploadFile->getMimeType(), $uploadFile->getName());

        try {
            CurlHelper::sendRequest($credential['host'], $body, [], 204);
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

    public function appendUploadObject(array $credential, AppendUploadFile $appendUploadFile): void
    {
        $object = $credential['dir'] . $appendUploadFile->getKeyPath();

        $credentials = $credential['credentials'];
        // 检查必填参数
        if (! isset($credential['host']) || ! isset($credential['dir']) || ! isset($credentials['AccessKeyId']) || ! isset($credentials['SecretAccessKey']) || ! isset($credentials['SessionToken'])) {
            throw new CloudFileException('TOS upload credential is invalid');
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

            $host = parse_url($credential['host'])['host'] ?? '';
            $headers = [
                'Host' => $host,
                'Content-Type' => $contentType,
                'Content-Length' => strlen($fileContent),
                'x-tos-security-token' => $credentials['SessionToken'],
                'Date' => $date,
                'x-tos-date' => $date,
            ];

            $request = TosSigner::sign(
                [
                    'headers' => $headers,
                    'method' => 'POST',
                    'key' => $object,
                    'queries' => [
                        'append' => '',
                        'offset' => (string) $appendUploadFile->getPosition(),
                    ],
                ],
                $host,
                $credentials['AccessKeyId'],
                $credentials['SecretAccessKey'],
                $credentials['SessionToken'],
                $credential['region']
            );

            $headers = $request['headers'];

            $body = file_get_contents($appendUploadFile->getRealPath());

            $url = $credential['host'] . '/' . $object . '?append&offset=' . $appendUploadFile->getPosition();
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
}
