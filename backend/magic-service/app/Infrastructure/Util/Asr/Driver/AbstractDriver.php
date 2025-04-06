<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\Util\Asr\Driver;

use App\Infrastructure\Util\Asr\Config\ConfigInterface;

abstract class AbstractDriver implements DriverInterface
{
    public function __construct(protected ConfigInterface $config)
    {
    }
}
