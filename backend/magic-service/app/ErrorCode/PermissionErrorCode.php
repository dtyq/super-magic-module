<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\ErrorCode;

use App\Infrastructure\Core\Exception\Annotation\ErrorMessage;

enum PermissionErrorCode: int
{
    #[ErrorMessage(message: 'permission.error')]
    case Error = 42000;

    #[ErrorMessage(message: 'permission.validate_failed')]
    case ValidateFailed = 42001;

    #[ErrorMessage(message: 'permission.business_exception')]
    case BusinessException = 42002;

    #[ErrorMessage(message: 'permission.access_denied')]
    case AccessDenied = 42003;
}
