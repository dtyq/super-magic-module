<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\Chat\Event\Publish;

use App\Domain\Chat\Entity\ValueObject\AmqpTopicType;
use App\Domain\Chat\Event\Seq\RecordingSummaryEndEvent;
use App\Infrastructure\Core\Traits\ChatAmqpTrait;
use Hyperf\Amqp\Annotation\Producer;
use Hyperf\Amqp\Message\ProducerMessage;

/**
 * 消息推送模块.
 * 直接推送seq给客户端.
 */
#[Producer]
class RecordingSummaryEndPublisher extends ProducerMessage
{
    use ChatAmqpTrait;

    protected AmqpTopicType $topic = AmqpTopicType::Recording;

    public function __construct(RecordingSummaryEndEvent $event)
    {
        $this->exchange = $this->getExchangeName($this->topic);
        $this->routingKey = $this->getRoutingKeyName($this->topic, $event->getPriority());
        $this->payload = [
            'app_message_id' => $event->getAppMessageId(),
        ];
    }
}
