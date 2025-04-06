<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\ModelAdmin\Constant;

enum OriginalModelType: int
{
    case SYSTEM_DEFAULT = 0; // 系统默认
    case ORGANIZATION_ADD = 1; // 组织添加
}
