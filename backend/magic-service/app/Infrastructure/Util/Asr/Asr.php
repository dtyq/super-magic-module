<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\Util\Asr;

use App\ErrorCode\AsrErrorCode;
use App\Infrastructure\Core\Exception\ExceptionBuilder;
use App\Infrastructure\Util\Asr\Config\VolcengineConfig;

/**
 * 增加新的Asr来源后请参考以下注释编写代码提示.
 * @method static Driver\DriverInterface volcengine(VolcengineConfig $config)
 */
class Asr
{
    public function __call(string $name, array $arguments)
    {
        return self::make($name, $arguments);
    }

    public static function __callStatic(string $name, array $arguments)
    {
        return self::make($name, $arguments);
    }

    private static function make(string $name, array $arguments)
    {
        $className = 'App\Infrastructure\Util\Asr\Driver\\' . ucfirst($name);
        if (! class_exists($className)) {
            ExceptionBuilder::throw(
                AsrErrorCode::DriverNotFound,
                'asr.driver_error.driver_not_found',
                ['driver' => $name]
            );
        }
        return make($className, $arguments);
    }
}
