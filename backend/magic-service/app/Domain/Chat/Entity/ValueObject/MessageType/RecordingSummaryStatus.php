<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\Chat\Entity\ValueObject\MessageType;

enum RecordingSummaryStatus: int
{
    case Start = 1;

    /**
     * 录音中.
     */
    case Recording = 2;

    /**
     * 录音结束
     */
    case End = 3;

    /**
     * 录音总结中.
     */
    case Summary = 4;

    /**
     * 录音总结结束.
     */
    case SummaryEnd = 5;

    public function getValue(): int
    {
        return $this->value;
    }
}
