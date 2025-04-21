<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\Chat\Service;

use App\Domain\Chat\Event\Agent\SpecialAgentEvent;
use Hyperf\Amqp\Message\ProducerMessage;
use Hyperf\Amqp\Producer;
use Hyperf\Contract\ConfigInterface;
use Psr\Log\LoggerInterface;

/**
 * 特殊智能体服务
 *
 * 负责根据 AI 代码处理智能体消息的发布
 */
class SpecialAgentService
{
    /**
     * @param ConfigInterface $config 配置
     * @param Producer $producer 消息生产者
     * @param LoggerInterface $logger 日志记录器
     */
    public function __construct(
        private readonly ConfigInterface $config,
        private readonly Producer $producer,
        private readonly LoggerInterface $logger
    ) {
    }

    /**
     * 处理特殊智能体事件.
     *
     * @param SpecialAgentEvent $event 智能体事件
     * @param string $aiCode AI 代码
     * @return bool 处理结果
     */
    public function handleSpecialAgentEvent(SpecialAgentEvent $event, string $aiCode): bool
    {
        // 从配置中获取发布者类
        $publishers = $this->config->get('super-magic.agent_publishers', []);

        // 如果没有对应的处理器，直接返回成功，不做处理
        if (! isset($publishers[$aiCode])) {
            $this->logger->debug("No publisher for AI code: {$aiCode}, skipping");
            return true;
        }

        $publisherClass = $publishers[$aiCode];

        // 实例化处理类
        $publisher = new $publisherClass($event);

        // 检查是否是 ProducerMessage 实例
        if (! $publisher instanceof ProducerMessage) {
            $this->logger->warning("Publisher class {$publisherClass} is not a ProducerMessage instance");
            return true;
        }

        // 发布消息
        $result = $this->producer->produce($publisher);

        if (! $result) {
            $this->logger->error('Failed to publish message for AI code: ' . $aiCode);
            return false;
        }

        return true;
    }
}
