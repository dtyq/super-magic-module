<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace HyperfTest\Cases\Infrastructure\Util\Storage;

use App\Infrastructure\Util\Storage\Driver\DriverInterface;
use App\Infrastructure\Util\Storage\Driver\Teamshare;
use App\Infrastructure\Util\Storage\Storage;
use PHPUnit\Framework\TestCase;
use RuntimeException;

/**
 * @internal
 */
class StorageTest extends TestCase
{
    public function testGetTeamshareDriver()
    {
        $this->assertInstanceOf(DriverInterface::class, Storage::Teamshare());
        $this->assertInstanceOf(Teamshare::class, Storage::Teamshare());
    }

    public function testGetNotExistDriver()
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Driver [NotExist] not supported.');
        /* @phpstan-ignore-next-line */
        Storage::NotExist();
    }
}
