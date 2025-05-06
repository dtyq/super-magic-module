<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Application\SuperAgent\Service;

use Hyperf\Logger\LoggerFactory;
use Psr\Log\LoggerInterface;

class LogAppService extends AbstractAppService
{
    protected LoggerInterface $logger;

    public function __construct(
        LoggerFactory $loggerFactory
    ) {
        $this->logger = $loggerFactory->get(get_class($this));
    }

    public function saveLog(string $log): bool
    {
        $this->logger->error(sprintf(
            'super magic frontend report log , message: %s',
            $log
        ));
        return true;
    }
}
