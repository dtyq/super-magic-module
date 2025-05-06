<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Application\SuperAgent\Event\Publish;

use Dtyq\SuperMagic\Domain\SuperAgent\Event\TopicTaskMessageEvent;
use Hyperf\Amqp\Annotation\Producer;
use Hyperf\Amqp\Message\ProducerMessage;

/**
 * 话题任务消息发布器.
 */
#[Producer(exchange: 'super_magic_topic_task_message', routingKey: 'super_magic_topic_task_message')]
class TopicTaskMessagePublisher extends ProducerMessage
{
    /**
     * 构造函数.
     */
    public function __construct(TopicTaskMessageEvent $event)
    {
        $this->payload = $event->toArray();
    }
}
