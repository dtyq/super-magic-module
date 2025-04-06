<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\CloudFile\Tests;

use Dtyq\CloudFile\CloudFile;
use Dtyq\CloudFile\Kernel\Exceptions\CloudFileException;
use Dtyq\SdkBase\SdkBase;
use PHPUnit\Framework\TestCase;

/**
 * @internal
 * @coversNothing
 */
class CloudFileBaseTest extends TestCase
{
    public function setUp(): void
    {
        error_reporting(E_ALL ^ E_DEPRECATED);
    }

    public function testCreateCloudFile()
    {
        $cloudFile = $this->createCloudFile();
        $this->assertInstanceOf(CloudFile::class, $cloudFile);
    }

    protected function createCloudFile(): CloudFile
    {
        // 如果要进行测试，需要填写对应的配置，需要真实，这里没有进行 mock
        $configs = [
            'storages' => json_decode(file_get_contents(__DIR__ . '/../storages.json'), true)['storages'] ?? [],
        ];

        $container = new SdkBase(new Container(), [
            'sdk_name' => 'easy_file_sdk',
            'exception_class' => CloudFileException::class,
            'cloudfile' => $configs,
        ]);

        return new CloudFile($container);
    }
}
