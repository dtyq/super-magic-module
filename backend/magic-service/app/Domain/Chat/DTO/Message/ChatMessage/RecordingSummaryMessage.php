<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\Chat\DTO\Message\ChatMessage;

use App\Domain\Chat\Entity\ValueObject\MessageType\ChatMessageType;
use App\Domain\Chat\Entity\ValueObject\MessageType\RecordingSummaryStatus;

class RecordingSummaryMessage extends AbstractAttachmentMessage
{
    /**
     * 录音文件的原始内容.
     */
    protected array $originContent = [];

    /**
     * 智能总结内容.
     */
    protected string $aiResult = '';

    /**
     * 总时长.
     */
    protected string $duration = '';

    /**
     * 状态.
     */
    protected RecordingSummaryStatus $status;

    /**
     * 智能总结标题.
     */
    protected string $title = '';

    /**
     * 录音音频.
     */
    protected ?array $attachments = null;

    /**
     * 单次翻译结果.
     */
    protected string $text = '';

    /**
     * 完整的翻译结果.
     */
    protected string $fullText = '';

    /**
     * 单次录音音频.
     */
    protected string $recordingBlob = '';

    /**
     * 文件保存格式.
     */
    protected ?string $lastAudioKey = null;

    protected ?string $audioLink = '';

    protected ?string $tempAudioKey = '';

    protected ?bool $isRecognize = true;

    public function __construct(?array $messageStruct = null)
    {
        if (isset($messageStruct['status'])) {
            $messageStruct['status'] = RecordingSummaryStatus::tryFrom($messageStruct['status']);
        }
        parent::__construct($messageStruct);
    }

    public function getOriginContent(): array
    {
        return $this->originContent;
    }

    public function setOriginContent(array $originContent): void
    {
        $this->originContent = $originContent;
    }

    public function getAiResult(): string
    {
        return $this->aiResult;
    }

    public function setAiResult(string $aiResult): void
    {
        $this->aiResult = $aiResult;
    }

    public function getDuration(): string
    {
        return $this->duration;
    }

    public function setDuration(string $duration): void
    {
        $this->duration = $duration;
    }

    public function getStatus(): RecordingSummaryStatus
    {
        return $this->status;
    }

    public function setStatus(RecordingSummaryStatus $status): void
    {
        $this->status = $status;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function setTitle(string $title): void
    {
        $this->title = $title;
    }

    public function getText(): string
    {
        return $this->text;
    }

    public function setText(string $text): void
    {
        $this->text = $text;
    }

    public function getRecordingBlob(): string
    {
        return $this->recordingBlob;
    }

    public function setRecordingBlob(string $recordingBlob): void
    {
        $this->recordingBlob = $recordingBlob;
    }

    public function getFullText(): string
    {
        return $this->fullText;
    }

    public function setFullText(string $fullText): void
    {
        $this->fullText = $fullText;
    }

    public function addFullText(string $text)
    {
        $this->fullText .= $text;
    }

    public function setLastAudioKey(?string $lastAudioKey): void
    {
        $this->lastAudioKey = $lastAudioKey;
    }

    public function getLastAudioKey(): ?string
    {
        return $this->lastAudioKey;
    }

    public function setAudioLink(?string $audioLink): void
    {
        $this->audioLink = $audioLink;
    }

    public function getAudioLink(): ?string
    {
        return $this->audioLink;
    }

    public function setTempAudioKey(?string $tempAudioKey): void
    {
        $this->tempAudioKey = $tempAudioKey;
    }

    public function getTempAudioKey(): ?string
    {
        return $this->tempAudioKey;
    }

    public function getIsRecognize(): ?bool
    {
        return $this->isRecognize;
    }

    public function setIsRecognize(?bool $isRecognize): void
    {
        $this->isRecognize = $isRecognize;
    }

    public static function fromArray(array $data): self
    {
        $message = new self();
        $message->setOriginContent($data['origin_content'] ?? []);
        $message->setAiResult($data['ai_result'] ?? '');
        $message->setDuration($data['duration'] ?? '');
        $message->setStatus(RecordingSummaryStatus::tryFrom($data['status']));
        $message->setTitle($data['title'] ?? '');
        $message->setText($data['text'] ?? '');
        $message->setRecordingBlob($data['recording_blob'] ?? '');
        $message->setFullText($data['full_text'] ?? '');
        $message->setLastAudioKey($data['last_audio_key'] ?? null);
        $message->setAudioLink($data['audio_link'] ?? null);
        $message->setTempAudioKey($data['temp_audio_key'] ?? null);
        $message->setIsRecognize($data['is_recognize']);
        return $message;
    }

    protected function setMessageType(): void
    {
        $this->chatMessageType = ChatMessageType::RecordingSummary;
    }
}
