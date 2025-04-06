<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\Chat\DTO\Message\StreamMessage;

use App\Domain\Chat\Entity\AbstractEntity;

class StreamOptions extends AbstractEntity
{
    protected StreamMessageStatus $status;

    protected bool $stream;

    // 用于标识流式消息的关联性。多段流式消息的 stream_app_message_id 相同
    // ai 搜索卡片消息的多段响应，已经将 app_message_id 作为关联 id，流式响应需要另外的 id 来做关联
    protected string $streamAppMessageId;

    public function getStreamAppMessageId(): ?string
    {
        return $this->streamAppMessageId;
    }

    public function setStreamAppMessageId(?string $streamAppMessageId): static
    {
        $this->streamAppMessageId = $streamAppMessageId;
        return $this;
    }

    // 消息是否是流式消息
    public function isStream(): bool
    {
        return $this->stream;
    }

    public function setStream(bool $stream): static
    {
        $this->stream = $stream;
        return $this;
    }

    public function getStatus(): StreamMessageStatus
    {
        return $this->status;
    }

    public function setStatus(null|int|StreamMessageStatus|string $status): static
    {
        if (is_numeric($status)) {
            $this->status = StreamMessageStatus::from((int) $status);
        } elseif ($status instanceof StreamMessageStatus) {
            $this->status = $status;
        } elseif ($status === null) {
            $this->status = StreamMessageStatus::Start;
        }
        return $this;
    }
}
