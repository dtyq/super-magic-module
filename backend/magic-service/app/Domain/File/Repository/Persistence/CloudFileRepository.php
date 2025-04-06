<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\File\Repository\Persistence;

use App\Domain\File\Repository\Persistence\Facade\CloudFileRepositoryInterface;
use App\Infrastructure\Core\ValueObject\StorageBucketType;
use Dtyq\CloudFile\CloudFile;
use Dtyq\CloudFile\Hyperf\CloudFileFactory;
use Dtyq\CloudFile\Kernel\Struct\CredentialPolicy;
use Dtyq\CloudFile\Kernel\Struct\FileLink;
use Dtyq\CloudFile\Kernel\Struct\FilePreSignedUrl;
use Dtyq\CloudFile\Kernel\Struct\UploadFile;
use Hyperf\Logger\LoggerFactory;
use Hyperf\Stringable\Str;
use Psr\Log\LoggerInterface;
use Throwable;

class CloudFileRepository implements CloudFileRepositoryInterface
{
    public const string DEFAULT_ICON_ORGANIZATION_CODE = 'MAGIC';

    private CloudFile $cloudFile;

    private LoggerInterface $logger;

    public function __construct(
        CloudFileFactory $cloudFileFactory,
        LoggerFactory $loggerFactory,
    ) {
        $this->logger = $loggerFactory->get('FileDomainService');
        $this->cloudFile = $cloudFileFactory->create();
    }

    /**
     * @return array<string,FileLink>
     */
    public function getLinks(string $organizationCode, array $filePaths, ?StorageBucketType $bucketType = null, array $downloadNames = []): array
    {
        $filePaths = array_filter($filePaths);

        if ($bucketType === null) {
            // 如果没有存储桶，进行一次自动归类
            $publicStorageKey = md5(StorageBucketType::Public->value);
            $publicFilePaths = [];

            $privateStorageKey = md5(StorageBucketType::Private->value);
            $privateFilePaths = [];
            foreach ($filePaths as $filePath) {
                /* @phpstan-ignore-next-line */
                if (empty($filePath)) {
                    continue;
                }
                if (Str::contains($filePath, $publicStorageKey)) {
                    $publicFilePaths[] = $filePath;
                } elseif (Str::contains($filePath, $privateStorageKey)) {
                    $privateFilePaths[] = $filePath;
                } else {
                    // 兜底私有桶
                    $privateFilePaths[] = $filePath;
                }
            }
            return array_merge(
                $this->getLinks($organizationCode, $privateFilePaths, StorageBucketType::Private, $downloadNames),
                $this->getLinks($organizationCode, $publicFilePaths, StorageBucketType::Public, $downloadNames)
            );
        }

        $links = [];
        $paths = [];
        $defaultIconPaths = [];
        foreach ($filePaths as $filePath) {
            /* @phpstan-ignore-next-line */
            if (! is_string($filePath)) {
                continue;
            }
            /* @phpstan-ignore-next-line */
            if (empty($filePath)) {
                continue;
            }
            if ($this->isDefaultIconPath($filePath)) {
                $defaultIconPaths[] = $filePath;
                continue;
            }
            // 如果不是组织开头的文件，忽略
            if (! Str::startsWith($filePath, $organizationCode)) {
                continue;
            }
            $paths[] = $filePath;
        }
        if (! empty($defaultIconPaths)) {
            $defaultIconLinks = $this->cloudFile->get(StorageBucketType::Public->value)->getLinks($defaultIconPaths, [], 7200, $this->getOptions(self::DEFAULT_ICON_ORGANIZATION_CODE));
            $links = array_merge($links, $defaultIconLinks);
        }
        if (empty($paths)) {
            return $links;
        }
        try {
            $otherLinks = $this->cloudFile->get($bucketType->value)->getLinks($paths, $downloadNames, 7200, $this->getOptions($organizationCode));
            $links = array_merge($links, $otherLinks);
        } catch (Throwable $throwable) {
            $this->logger->warning('GetLinksError', [
                'file_paths' => $filePaths,
                'error' => $throwable->getMessage(),
            ]);
        }
        return $links;
    }

    public function uploadByCredential(string $organizationCode, UploadFile $uploadFile, StorageBucketType $storage = StorageBucketType::Private, bool $autoDir = true): void
    {
        $filesystem = $this->cloudFile->get($storage->value);
        $credentialPolicy = new CredentialPolicy([
            'sts' => false,
            'role_session_name' => 'magic',
            // 采用在文件路径中增加配置名的形式后续获取链接时自动识别
            'dir' => $autoDir ? $this->getDir($organizationCode) . '/' . md5($storage->value) : '',
        ]);
        $filesystem->uploadByCredential($uploadFile, $credentialPolicy, $this->getOptions($organizationCode));
    }

    public function upload(string $organizationCode, UploadFile $uploadFile, StorageBucketType $storage = StorageBucketType::Private, bool $autoDir = true): void
    {
        $filesystem = $this->cloudFile->get($storage->value);
        $filesystem->upload($uploadFile, $this->getOptions($organizationCode));
    }

    public function getSimpleUploadTemporaryCredential(string $organizationCode, string $storage = 'private'): array
    {
        $filesystem = $this->cloudFile->get($storage);
        $credentialPolicy = new CredentialPolicy([
            'sts' => false,
            'role_session_name' => 'magic',
            // 采用在文件路径中增加配置名的形式后续获取链接时自动识别
            'dir' => $this->getDir($organizationCode) . '/' . md5($storage),
        ]);
        return $filesystem->getUploadTemporaryCredential($credentialPolicy, $this->getOptions($organizationCode));
    }

    /**
     * @return array<string, FilePreSignedUrl>
     */
    public function getPreSignedUrls(string $organizationCode, array $fileNames, int $expires = 3600, StorageBucketType $bucketType = StorageBucketType::Private): array
    {
        return $this->cloudFile->get($bucketType->value)->getPreSignedUrls($fileNames, $expires, $this->getOptions($organizationCode));
    }

    public function getMetas(array $paths, string $organizationCode): array
    {
        return $this->cloudFile->get(StorageBucketType::Private->value)->getMetas($paths, $this->getOptions($organizationCode));
    }

    public function getDefaultIconPaths(): array
    {
        $appId = 'open';
        $defaultIconPath = BASE_PATH . '/storage/files/' . $this->getDefaultIconDir($appId);
        $files = glob($defaultIconPath . '/*.png');
        return array_map(static function ($file) {
            return str_replace(BASE_PATH . '/storage/files/', '', $file);
        }, $files);
    }

    public function getDefaultIconDir(string $appId = 'open'): string
    {
        return $this->getDir(self::DEFAULT_ICON_ORGANIZATION_CODE, $appId) . '/default';
    }

    public function getDir(string $organizationCode, string $appId = 'open'): string
    {
        return $organizationCode . '/' . $appId;
    }

    protected function getOptions(string $organizationCode): array
    {
        return [
            'organization_code' => $organizationCode,
            'cache' => false,
        ];
    }

    protected function isDefaultIconPath(string $path): bool
    {
        $prefix = $this->getDefaultIconDir('');
        return Str::startsWith($path, $prefix);
    }
}
