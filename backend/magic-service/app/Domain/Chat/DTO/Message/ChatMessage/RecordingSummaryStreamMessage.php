<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\Chat\DTO\Message\ChatMessage;

use App\Domain\Chat\DTO\Message\StreamMessage\StreamMessageStatus;
use App\Domain\Chat\Entity\ValueObject\MessageType\ChatMessageType;

class RecordingSummaryStreamMessage extends AbstractChatMessageStruct
{
    protected string $id = '';

    protected string $appMessageId = '';

    protected ChatMessageType $type;

    protected StreamMessageStatus $status;

    protected array $seqMessageIds = [];

    protected array $content = [];

    protected array $sequenceContent = [];

    protected string $createdAt = '';

    protected string $updatedAt = '';

    public function getId(): string
    {
        return $this->id;
    }

    public function setId(string $id): void
    {
        $this->id = $id;
    }

    public function getAppMessageId(): string
    {
        return $this->appMessageId;
    }

    public function setAppMessageId(string $appMessageId): void
    {
        $this->appMessageId = $appMessageId;
    }

    public function getContent(): array
    {
        return $this->content;
    }

    public function setContent(array $content): void
    {
        $this->content = $content;
    }

    public function getCreatedAt(): string
    {
        return $this->createdAt;
    }

    public function setCreatedAt(string $createdAt): void
    {
        $this->createdAt = $createdAt;
    }

    public function getUpdatedAt(): string
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(string $updatedAt): void
    {
        $this->updatedAt = $updatedAt;
    }

    public function setType(ChatMessageType $type): void
    {
        $this->type = $type;
    }

    public function getType(): ChatMessageType
    {
        return $this->type;
    }

    public function getStatus(): StreamMessageStatus
    {
        return $this->status;
    }

    public function setStatus(StreamMessageStatus $status): void
    {
        $this->status = $status;
    }

    public function getSeqMessageIds(): array
    {
        return $this->seqMessageIds;
    }

    public function setSeqMessageIds(array $seqMessageIds): void
    {
        $this->seqMessageIds = $seqMessageIds;
    }

    public function addSeqId(string $seqId)
    {
        $this->seqMessageIds[] = $seqId;
    }

    public function getSequenceContent(): array
    {
        return $this->sequenceContent;
    }

    public function setSequenceContent(array $sequenceContent): void
    {
        $this->sequenceContent = $sequenceContent;
    }

    protected function setMessageType(): void
    {
        $this->chatMessageType = ChatMessageType::StreamAggregateAISearchCard;
    }
}
