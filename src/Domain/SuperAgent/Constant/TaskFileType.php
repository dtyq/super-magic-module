<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Domain\SuperAgent\Constant;

enum TaskFileType: string
{
    case USER_UPLOAD = 'user_upload';
    case PROCESS = 'process';
    case FINAL = 'final';
}
