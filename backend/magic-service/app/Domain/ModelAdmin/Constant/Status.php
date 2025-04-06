<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\ModelAdmin\Constant;

enum Status: int
{
    case DISABLE = 0;
    case ACTIVE = 1;

    public function label(): string
    {
        return match ($this) {
            self::DISABLE => '禁用',
            self::ACTIVE => '已激活',
        };
    }
}
