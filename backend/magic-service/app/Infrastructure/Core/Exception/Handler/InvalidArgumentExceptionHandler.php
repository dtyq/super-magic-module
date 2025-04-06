<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\Core\Exception\Handler;

use Dtyq\FlowExprEngine\Exception\FlowExprEngineException;
use Throwable;

class InvalidArgumentExceptionHandler extends BusinessExceptionHandler
{
    public function isValid(Throwable $throwable): bool
    {
        if ($throwable->getPrevious() instanceof FlowExprEngineException || $throwable instanceof FlowExprEngineException) {
            return true;
        }
        return false;
    }
}
