<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Interfaces\Authorization\Web;

use App\Infrastructure\Core\UnderlineObjectJsonSerializable;
use Hyperf\Context\Context;
use Qbhy\HyperfAuth\Authenticatable;

abstract class AbstractAuthorization extends UnderlineObjectJsonSerializable implements Authenticatable
{
    /**
     * 通过对象的方法调用操作auth,而不是直接使用协程,减少迭代和理解成本.
     */
    public function setUserAuthToContext(string $key): void
    {
        Context::set($key, $this);
    }
}
