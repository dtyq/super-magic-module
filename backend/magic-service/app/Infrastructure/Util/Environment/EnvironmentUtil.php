<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\Util\Environment;

class EnvironmentUtil
{
    public const string ENV_LOCAL = 'local';

    public const string ENV_LOCAL_DEV = 'local-dev';

    // 是否本地环境
    public static function isLocal(): bool
    {
        if (in_array(self::getEnv(), [self::ENV_LOCAL, self::ENV_LOCAL_DEV])) {
            return true;
        }
        return false;
    }

    public static function getEnv(): string
    {
        return env('APP_ENV');
    }
}
