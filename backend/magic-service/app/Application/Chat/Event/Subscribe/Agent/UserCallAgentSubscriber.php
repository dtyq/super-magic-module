<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\Chat\Event\Subscribe\Agent;

use App\Application\Chat\Event\Subscribe\Agent\Factory\AgentFactory;
use App\Domain\Chat\Entity\ValueObject\MessageType\ControlMessageType;
use App\Domain\Chat\Event\Agent\UserCallAgentEvent;
use App\Domain\Chat\Service\MagicConversationDomainService;
use Hyperf\Event\Annotation\Listener;
use Hyperf\Event\Contract\ListenerInterface;
use Hyperf\Logger\LoggerFactory;
use Psr\Container\ContainerInterface;
use Psr\Log\LoggerInterface;

#[Listener]
class UserCallAgentSubscriber implements ListenerInterface
{
    protected LoggerInterface $logger;

    protected ContainerInterface $container;

    public function __construct(
        ContainerInterface $container,
    ) {
        $this->container = $container;
        $this->logger = $container->get(LoggerFactory::class)->get(static::class);
    }

    public function listen(): array
    {
        return [
            UserCallAgentEvent::class,
        ];
    }

    public function process(object $event): void
    {
        /** @var UserCallAgentEvent $event */
        if (! $event instanceof UserCallAgentEvent) {
            return;
        }
        $messageEntity = $event->messageEntity;
        $seqEntity = $event->seqEntity;
        $agentAccountEntity = $event->agentAccountEntity;
        $agentUserEntity = $event->agentUserEntity;
        $senderUserEntity = $event->senderUserEntity;
        $senderAccountEntity = $event->senderAccountEntity;

        $magicConversationDomainService = $this->container->get(MagicConversationDomainService::class);

        // 流程开始执行前,触发开始输入事件
        if ($seqEntity->canTriggerFlowOperateConversationStatus()) {
            $magicConversationDomainService->agentOperateConversationStatus(
                ControlMessageType::StartConversationInput,
                $seqEntity->getConversationId()
            );
        }

        // 执行流程
        AgentFactory::make($agentAccountEntity->getAiCode())->execute($event);

        // 流程执行结束，推送结束输入事件
        // ai准备开始发消息了,结束输入状态
        if ($seqEntity->canTriggerFlowOperateConversationStatus()) {
            $magicConversationDomainService->agentOperateConversationStatus(
                ControlMessageType::EndConversationInput,
                $seqEntity->getConversationId()
            );
        }
    }
}
