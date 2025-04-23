<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\ModelAdmin\Constant;

enum DisabledByType: string
{
    case OFFICIAL = 'OFFICIAL'; // 官方禁用
    case USER = 'USER'; // 用户禁用
}
