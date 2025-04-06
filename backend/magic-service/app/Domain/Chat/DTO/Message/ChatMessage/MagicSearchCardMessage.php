<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\Chat\DTO\Message\ChatMessage;

use App\Domain\Chat\Entity\ValueObject\MessageType\ChatMessageType;

/**
 * 麦吉搜索的响应卡片消息.
 */
class MagicSearchCardMessage extends AbstractChatMessageStruct
{
    protected array $search = [];

    /**
     * 大模型响应的文本内容.
     */
    protected string $llmResponse = '';

    protected array $relatedQuestions = [];

    public function getLlmResponse(): string
    {
        return $this->llmResponse;
    }

    public function setLlmResponse(string $llmResponse): void
    {
        $this->llmResponse = $llmResponse;
    }

    public function getSearch(): array
    {
        return $this->search;
    }

    public function setSearch(array $search): void
    {
        $this->search = $search;
    }

    protected function setMessageType(): void
    {
        $this->chatMessageType = ChatMessageType::MagicSearchCard;
    }
}
