<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\ModelAdmin\Constant;

enum ServiceProviderType: int
{
    case NORMAL = 0;
    case OFFICIAL = 1;
    case CUSTOM = 2;

    public function label(): string
    {
        return match ($this) {
            self::NORMAL => '普通',
            self::OFFICIAL => '官方',
            self::CUSTOM => '自定义',
        };
    }
}
