<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\Chat\Service\Agent;

use App\Application\Chat\Event\Subscribe\Agent\Factory\AgentFactory;
use App\Domain\Chat\Entity\ValueObject\MessageType\ControlMessageType;
use App\Domain\Chat\Event\Agent\UserCallAgentEvent;
use App\Domain\Chat\Service\MagicConversationDomainService;
use App\Infrastructure\Core\Contract\Agent\UserCallAgentInterface;

class DefaultUserCallAgentService implements UserCallAgentInterface
{
    public function __construct(
        protected MagicConversationDomainService $magicConversationDomainService
    ) {
    }

    public function process(UserCallAgentEvent $event): void
    {
        $seqEntity = $event->seqEntity;
        $agentAccountEntity = $event->agentAccountEntity;

        // 流程开始执行前,触发开始输入事件
        if ($seqEntity->canTriggerFlowOperateConversationStatus()) {
            $this->magicConversationDomainService->agentOperateConversationStatus(
                ControlMessageType::StartConversationInput,
                $seqEntity->getConversationId()
            );
        }

        // 执行流程
        AgentFactory::make($agentAccountEntity->getAiCode())->execute($event);

        // 流程执行结束，推送结束输入事件
        if ($seqEntity->canTriggerFlowOperateConversationStatus()) {
            $this->magicConversationDomainService->agentOperateConversationStatus(
                ControlMessageType::EndConversationInput,
                $seqEntity->getConversationId()
            );
        }
    }

    public function canHandle(string $aiCode): bool
    {
        // 默认处理器可以处理所有 AI Code
        return true;
    }

    /**
     * 获取处理器优先级.
     *
     * 开源版本默认优先级为0
     */
    public static function getPriority(): int
    {
        return 0;
    }
}
