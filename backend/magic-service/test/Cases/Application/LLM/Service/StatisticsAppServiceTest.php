<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace HyperfTest\Cases\Application\LLM\Service;

use App\Application\ModelGateway\Service\StatisticsAppService;
use HyperfTest\HttpTestCase;

/**
 * @internal
 */
class StatisticsAppServiceTest extends HttpTestCase
{
    public function testQueryUsage()
    {
        $start = '2025-02-23 00:00:00';
        $end = '2025-02-23 23:59:59';
        $result = di(StatisticsAppService::class)->queryUsage($start, $end);
        var_dump($result);
        $this->assertIsArray($result);
    }
}
