<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\Core\Traits;

use App\ErrorCode\UserErrorCode;
use App\Infrastructure\Core\Exception\ExceptionBuilder;
use App\Infrastructure\Util\Context\RequestCoContext;
use App\Interfaces\Authorization\Web\MagicUserAuthorization;
use Qbhy\HyperfAuth\Authenticatable;

trait MagicUserAuthorizationTrait
{
    /**
     * @return MagicUserAuthorization
     */
    protected function getAuthorization(): Authenticatable
    {
        $magicUserAuthorization = RequestCoContext::getUserAuthorization();
        if (! $magicUserAuthorization) {
            ExceptionBuilder::throw(UserErrorCode::ACCOUNT_ERROR);
        }
        return $magicUserAuthorization;
    }
}
