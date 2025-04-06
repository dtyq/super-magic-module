<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace HyperfTest\Cases\Application\Flow\ExecuteManager\NodeRunner\Cache;

use App\Application\Flow\ExecuteManager\NodeRunner\Cache\StringCacheDriver;
use HyperfTest\Cases\Application\Flow\ExecuteManager\ExecuteManagerBaseTest;

/**
 * @internal
 */
class StringCacheDriverTest extends ExecuteManagerBaseTest
{
    public function testSet()
    {
        $stringCache = make(StringCacheDriver::class);
        $this->assertTrue($stringCache->set('flowCode', 'key1', 'value'));
        $this->assertTrue($stringCache->del('flowCode', 'key1'));
        $this->assertTrue($stringCache->set('flowCode', 'key2', 'value', 1));
    }

    public function testGet()
    {
        $stringCache = make(StringCacheDriver::class);
        $this->assertEquals('', $stringCache->get('flowCode', 'key1'));
        $this->assertEquals('default', $stringCache->get('flowCode', 'key3', 'default'));
    }
}
