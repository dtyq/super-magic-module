<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace HyperfTest\Cases;

use App\Infrastructure\Core\Contract\Session\SessionInterface;
use HyperfTest\HttpTestCase;

/**
 * @internal
 */
class BaseTest extends HttpTestCase
{
    public function testO()
    {
        $sessionInterface = di(SessionInterface::class);
        var_dump(get_class($sessionInterface));
    }
}
