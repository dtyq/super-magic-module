<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\Chat\Entity\ValueObject;

enum MagicMessageStatus: int
{
    // 未读
    case Unread = 0;

    // 已读
    case Seen = 1;

    // 已查看（非纯文本的复杂类型消息，用户点击了详情）
    case Read = 2;

    // 已撤回
    case Revoked = 3;

    public function getStatusName(): string
    {
        return strtolower($this->name);
    }
}
