<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\AsyncEvent\Kernel\Crontab;

use Dtyq\AsyncEvent\Kernel\AsyncEventRetry;
use Dtyq\AsyncEvent\Kernel\Service\AsyncEventService;
use Dtyq\AsyncEvent\Kernel\Utils\Locker;
use Hyperf\Coroutine\Parallel;
use Hyperf\Logger\LoggerFactory;
use Psr\Log\LoggerInterface;
use Throwable;

class RetryCrontab
{
    private AsyncEventService $asyncEventService;

    private LoggerInterface $logger;

    private Locker $locker;

    public function __construct(AsyncEventService $asyncEventService, LoggerFactory $loggerFactory, Locker $locker)
    {
        $this->asyncEventService = $asyncEventService;
        $this->logger = $loggerFactory->get('RetryCrontab');
        $this->locker = $locker;
    }

    public function execute(): void
    {
        try {
            // 查询卡在待执行或者执行中的记录
            $datetime = date('Y-m-d H:i:s', time() - (int) \Hyperf\Config\config('async_event.retry.interval', 600));
            $recordIds = $this->asyncEventService->getTimeoutRecordIds($datetime);
            $parallel = new Parallel(30);
            foreach ($recordIds as $recordId) {
                $parallel->add(function () use ($recordId) {
                    $this->locker->get(function () use ($recordId) {
                        $this->logger->info("Retry async event [{$recordId}].");
                        AsyncEventRetry::retry($recordId);
                    }, "async_event_retry_{$recordId}");
                });
            }
            $parallel->wait(false);
        } catch (Throwable $throwable) {
            $this->logger->error($throwable->getTraceAsString());
        }
    }

    public function isEnable(): bool
    {
        return true;
    }
}
