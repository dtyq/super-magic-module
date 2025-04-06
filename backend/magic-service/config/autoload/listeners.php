<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */
use App\Application\Kernel\Event\Subscribe\MagicWatchDogSubscriber;
use Hyperf\Command\Listener\FailToHandleListener;
use Hyperf\ExceptionHandler\Listener\ErrorExceptionHandler;

return [
    ErrorExceptionHandler::class,
    FailToHandleListener::class,
    MagicWatchDogSubscriber::class,
];
