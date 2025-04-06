<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\Chat\DTO\Message;

use App\Domain\Chat\Entity\ValueObject\MessageType\ChatMessageType;
use App\Domain\Chat\Entity\ValueObject\MessageType\ControlMessageType;

/**
 * 聊天消息/控制消息都需要实现的接口.
 */
interface MessageInterface
{
    public function toArray(bool $filterNull = false): array;

    public function getMessageTypeEnum(): ChatMessageType|ControlMessageType;
}
