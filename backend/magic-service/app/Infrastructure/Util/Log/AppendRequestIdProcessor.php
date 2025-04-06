<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\Util\Log;

use App\Infrastructure\Util\Context\CoContext;
use Hyperf\Engine\Coroutine;
use Monolog\LogRecord;
use Monolog\Processor\ProcessorInterface;

class AppendRequestIdProcessor implements ProcessorInterface
{
    public function __invoke(LogRecord $record): LogRecord
    {
        $context = $record->context;

        $context['system_info'] = [
            'request_id' => CoContext::getOrSetRequestId(),
            'coroutine_id' => Coroutine::id(),
            'trace_id' => CoContext::getTraceId(),
        ];

        return $record->with(context: $context);
    }
}
