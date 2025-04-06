<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace HyperfTest\Cases\Infrastructure\Util\Storage\Driver;

use App\Infrastructure\Util\Storage\Config\TeamshareConfig;
use App\Infrastructure\Util\Storage\Storage;
use App\Infrastructure\Util\Storage\ValueObject\TeamshareOptions;
use PHPUnit\Framework\TestCase;

/**
 * @internal
 */
class TeamshareTest extends TestCase
{
    public function testApplyUploadTemporaryCredential()
    {
        $this->markTestSkipped('Skip this test');
        $config = new TeamshareConfig();
        $options = new TeamshareOptions();
        $options->setAuthorization($token['token_type'] . ' ' . $token['access_token']);
        $result = Storage::Teamshare($config)->applyUploadTemporaryCredential($options);
        $this->assertNotNull($result);
    }

    public function testUpload()
    {
        $this->markTestSkipped('Skip this test');
        $config = new TeamshareConfig();
        $options = new TeamshareOptions();
        $result = Storage::Teamshare($config)->upload('/tmp/test.txt', null, $options);
        $this->assertNotNull($result);
    }
}
