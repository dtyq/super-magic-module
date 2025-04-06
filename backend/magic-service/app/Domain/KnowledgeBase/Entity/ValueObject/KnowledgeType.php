<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\KnowledgeBase\Entity\ValueObject;

enum KnowledgeType: int
{
    /*
     * 用户自建知识库
     */
    case UserKnowledgeBase = 1;

    /*
     * 天书知识库
     */
    case TeamShareKnowledge = 2;

    /*
     * 天书云文件
     */
    case TeamShareFile = 3;

    /*
     * 用户话题
     */
    case UserTopic = 4;

    /*
     * 用户会话
     */
    case UserConversation = 5;

    public function openCanSave(): bool
    {
        return in_array($this, self::openList());
    }

    public static function openList(): array
    {
        return [self::TeamShareKnowledge, self::TeamShareFile];
    }

    public static function openListValue(): array
    {
        return array_map(fn ($item) => $item->value, self::openList());
    }
}
