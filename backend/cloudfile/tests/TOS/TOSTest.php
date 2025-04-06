<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\CloudFile\Tests\TOS;

use Dtyq\CloudFile\Kernel\FilesystemProxy;
use Dtyq\CloudFile\Kernel\Struct\CredentialPolicy;
use Dtyq\CloudFile\Kernel\Struct\UploadFile;
use Dtyq\CloudFile\Tests\CloudFileBaseTest;

/**
 * @internal
 * @coversNothing
 */
class TOSTest extends CloudFileBaseTest
{
    public function testGetUploadTemporaryCredential()
    {
        $filesystem = $this->getFilesystem();

        $credentialPolicy = new CredentialPolicy([
            'sts' => false,
            'roleSessionName' => 'test',
        ]);
        $res = $filesystem->getUploadTemporaryCredential($credentialPolicy);
        $this->assertArrayHasKey('x-tos-signature', $res);
        $this->assertArrayHasKey('expires', $res);
        var_dump($res);

        $credentialPolicy = new CredentialPolicy([
            'sts' => true,
            'roleSessionName' => 'test',
        ]);
        $res = $filesystem->getUploadTemporaryCredential($credentialPolicy);
        $this->assertArrayHasKey('credentials', $res);
        $this->assertArrayHasKey('expires', $res);
    }

    public function testUpload()
    {
        $filesystem = $this->getFilesystem();

        $realPath = __DIR__ . '/../test.txt';

        $uploadFile = new UploadFile($realPath, 'easy-file', '', false);
        $filesystem->upload($uploadFile);
        $this->assertTrue(true);
    }

    public function testSimpleUpload()
    {
        $filesystem = $this->getFilesystem();

        $credentialPolicy = new CredentialPolicy([
            'sts' => false,
        ]);

        $realPath = __DIR__ . '/../test.txt';

        $uploadFile = new UploadFile($realPath, 'easy-file');
        $filesystem->uploadByCredential($uploadFile, $credentialPolicy);
        $this->assertTrue(true);
    }

    public function testGetMetadata()
    {
        $filesystem = $this->getFilesystem();

        $fileAttributes = $filesystem->getMetas([
            'easy-file/test.txt',
        ]);
        $this->assertArrayHasKey('easy-file/test.txt', $fileAttributes);
    }

    public function testGetLinks()
    {
        $filesystem = $this->getFilesystem();

        $list = $filesystem->getLinks([
            'easy-file/test.txt',
        ], [], 7200);
        $this->assertArrayHasKey('easy-file/test.txt', $list);
    }

    public function testDestroy()
    {
        $filesystem = $this->getFilesystem();

        $realPath = __DIR__ . '/../test.txt';

        $uploadFile = new UploadFile($realPath, 'easy-file', '111.txt', false);
        $path = $filesystem->upload($uploadFile);
        $this->assertEquals('easy-file/111.txt', $path);
        $filesystem->destroy([
            $path,
        ]);
        $this->assertTrue(true);
    }

    public function testDuplicate()
    {
        $filesystem = $this->getFilesystem();

        $path = $filesystem->duplicate('easy-file/test.txt', 'easy-file/test-copy.txt');
        $this->assertIsString($path);
    }

    private function getFilesystem(): FilesystemProxy
    {
        $easyFile = $this->createCloudFile();
        return $easyFile->get('tos_test');
    }
}
