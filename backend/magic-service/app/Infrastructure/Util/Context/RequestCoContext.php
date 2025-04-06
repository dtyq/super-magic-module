<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\Util\Context;

use App\Interfaces\Authorization\Web\MagicUserAuthorization;
use Hyperf\Context\Context;

class RequestCoContext
{
    /**
     * 从父协程获取用户信息。
     */
    public static function getUserAuthorization(): ?MagicUserAuthorization
    {
        return Context::get('magic-user-authorization');
    }

    public static function setUserAuthorization(MagicUserAuthorization $userAuthorization): void
    {
        Context::set('magic-user-authorization', $userAuthorization);
    }
}
