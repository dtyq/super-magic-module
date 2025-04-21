<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\Chat\Event\Agent;

use App\Domain\Chat\Entity\MagicMessageEntity;
use App\Domain\Chat\Entity\MagicSeqEntity;
use App\Domain\Contact\Entity\AccountEntity;
use App\Domain\Contact\Entity\MagicUserEntity;
use App\Infrastructure\Core\AbstractEvent;

class SpecialAgentEvent extends AbstractEvent
{
    protected AccountEntity $agentAccountEntity;

    protected MagicUserEntity $agentUserEntity;

    protected MagicUserEntity $senderUserEntity;

    protected MagicSeqEntity $seqEntity;

    protected MagicMessageEntity $messageEntity;

    public function __construct(
        AccountEntity $agentAccountEntity,
        MagicUserEntity $agentUserEntity,
        MagicUserEntity $senderUserEntity,
        MagicSeqEntity $seqEntity,
        MagicMessageEntity $messageEntity,
    ) {
        $this->agentAccountEntity = $agentAccountEntity;
        $this->agentUserEntity = $agentUserEntity;
        $this->senderUserEntity = $senderUserEntity;
        $this->seqEntity = $seqEntity;
        $this->messageEntity = $messageEntity;
    }

    public function getAgentAccountEntity(): AccountEntity
    {
        return $this->agentAccountEntity;
    }

    public function getAgentUserEntity(): MagicUserEntity
    {
        return $this->agentUserEntity;
    }

    public function getSenderUserEntity(): MagicUserEntity
    {
        return $this->senderUserEntity;
    }

    public function getSeqEntity(): MagicSeqEntity
    {
        return $this->seqEntity;
    }

    public function getMessageEntity(): MagicMessageEntity
    {
        return $this->messageEntity;
    }
}
