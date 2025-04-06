<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\Chat\Event\Subscribe\Agent\Agents;

use App\Application\Chat\Service\MagicChatAIImageAppService;
use App\Domain\Chat\DTO\AIImage\Request\MagicChatAIImageReqDTO;
use App\Domain\Chat\Event\Agent\UserCallAgentEvent;
use App\Infrastructure\Util\Context\RequestContext;
use App\Interfaces\Authorization\Web\MagicUserAuthorization;

class MagicAIImageAgent extends AbstractAgent
{
    public function __construct(
    ) {
    }

    public function execute(UserCallAgentEvent $event): void
    {
        $seqEntity = $event->seqEntity;
        $messageEntity = $event->messageEntity;
        $topicId = (string) $seqEntity->getExtra()?->getTopicId(); // 话题 id
        $requestContext = new RequestContext();
        $userAuthorization = new MagicUserAuthorization();
        $userAuthorization->setId($event->senderUserEntity->getUserId());
        $userAuthorization->setOrganizationCode($event->senderUserEntity->getOrganizationCode());
        $userAuthorization->setUserType($event->senderUserEntity->getUserType());
        $requestContext->setUserAuthorization($userAuthorization);
        $requestContext->setOrganizationCode($event->senderUserEntity->getOrganizationCode());
        $this->getMagicChatAIImageAppService()->handleUserMessage(
            $requestContext,
            (new MagicChatAIImageReqDTO())
                ->setTopicId($topicId)
                ->setConversationId($seqEntity->getConversationId())
                ->setUserMessage($messageEntity->getContent())
        );
    }

    private function getMagicChatAIImageAppService(): MagicChatAIImageAppService
    {
        return di(MagicChatAIImageAppService::class);
    }
}
