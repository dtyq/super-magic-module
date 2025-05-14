<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Application\SuperAgent\Event\Subscribe;

use Dtyq\SuperMagic\Application\SuperAgent\Service\AccountAppService;
use Hyperf\Amqp\Annotation\Consumer;
use Hyperf\Amqp\Message\ConsumerMessage;
use Hyperf\Amqp\Result;
use Hyperf\Contract\StdoutLoggerInterface;
use PhpAmqpLib\Message\AMQPMessage;
use Throwable;

#[Consumer(exchange: 'organization_created_message', routingKey: 'organization_created_message', queue: 'organization_created_message', nums: 1)]
class InitAccountMessageSubscriber extends ConsumerMessage
{
    public function __construct(
        private readonly AccountAppService $accountAppService,
        private readonly StdoutLoggerInterface $logger
    ) {
    }

    public function consumeMessage($event, AMQPMessage $message): Result
    {
        try {
            $this->logger->debug(sprintf(
                '接收到组织创建消息，事件: %s',
                json_encode($event, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
            ));

            // 提取必要信息
            $organizationCode = $event['organization_code'] ?? '';

            // 参数验证
            if (empty($organizationCode)) {
                $this->logger->error(sprintf(
                    '消息参数不完整, $organizationCode: %s',
                    $organizationCode,
                ));
                return Result::ACK;
            }
            $this->accountAppService->initAccount($organizationCode);
            $this->logger->info(sprintf('超级麦吉账户已初始化，组织code: %s', $organizationCode));

            return Result::ACK;
        } catch (Throwable $e) {
            $this->logger->error(sprintf(
                '处理超级麦吉账户消息失败: %s, event: %s',
                $e->getMessage(),
                json_encode($event, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
            ));

            return Result::ACK; // 即使出错也确认消息，避免消息堆积
        }
    }
}
