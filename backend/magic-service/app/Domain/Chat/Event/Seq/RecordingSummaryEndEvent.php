<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\Chat\Event\Seq;

use App\Domain\Chat\Entity\ValueObject\MessagePriority;
use App\Infrastructure\Core\AbstractEvent;

class RecordingSummaryEndEvent extends AbstractEvent
{
    protected MessagePriority $seqPriority;

    public function __construct(
        protected string $appMessageId,
        ?MessagePriority $seqPriority = null,
    ) {
        $this->seqPriority = $seqPriority ?? MessagePriority::High;
    }

    public function getPriority(): MessagePriority
    {
        return $this->seqPriority;
    }

    public function setPriority(MessagePriority $priority): void
    {
        $this->seqPriority = $priority;
    }

    public function getAppMessageId(): string
    {
        return $this->appMessageId;
    }

    public function setAppMessageId(string $appMessageId): void
    {
        $this->appMessageId = $appMessageId;
    }
}
