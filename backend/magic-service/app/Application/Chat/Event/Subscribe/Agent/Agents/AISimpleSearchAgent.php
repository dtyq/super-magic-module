<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\Chat\Event\Subscribe\Agent\Agents;

use App\Application\Chat\Service\MagicChatAISearchAppService;
use App\Domain\Chat\DTO\AISearch\Request\MagicChatAggregateSearchReqDTO;
use App\Domain\Chat\Event\Agent\UserCallAgentEvent;

use function di;

class AISimpleSearchAgent extends AbstractAgent
{
    public function __construct(
    ) {
    }

    public function execute(UserCallAgentEvent $event): void
    {
        $messageEntity = $event->messageEntity;
        $seqEntity = $event->seqEntity;
        // magic-mind-search 需要流式响应，暂时先指定 code 这么判断
        $topicId = (string) $seqEntity->getExtra()?->getTopicId(); // 话题 id
        $this->getMagicChatAISearchAppService()->aggregateSearch(
            (new MagicChatAggregateSearchReqDTO())
                ->setTopicId($topicId)
                ->setConversationId($seqEntity->getConversationId())
                ->setUserMessage($messageEntity->getContent())
        );
    }

    private function getMagicChatAISearchAppService(): MagicChatAISearchAppService
    {
        return di(MagicChatAISearchAppService::class);
    }
}
