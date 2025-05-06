<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Domain\Chat\DTO\Message\ChatMessage;

use App\Domain\Chat\DTO\Message\ChatMessage\AbstractChatMessageStruct;
use App\Domain\Chat\DTO\Message\ChatMessage\SuperAgentMessageInterface;
use App\Domain\Chat\DTO\Message\TextContentInterface;
use App\Domain\Chat\Entity\ValueObject\MessageType\ChatMessageType;
use Dtyq\SuperMagic\Domain\Chat\DTO\Message\ChatMessage\Item\SuperAgentStep;
use Dtyq\SuperMagic\Domain\Chat\DTO\Message\ChatMessage\Item\SuperAgentTool;

class SuperAgentMessage extends AbstractChatMessageStruct implements TextContentInterface, SuperAgentMessageInterface
{
    protected ?string $topicId = '';

    protected ?string $messageId = null;

    protected ?string $taskId = null;

    protected ?string $type = null;

    protected ?string $status = null;

    protected ?string $content = null;

    protected ?array $steps = null;

    protected ?string $event = '';

    protected ?string $role = '';

    protected ?SuperAgentTool $tool = null;

    protected ?int $sendTimestamp = null;

    protected ?array $attachments = null;

    public function __construct(?array $messageStruct = null)
    {
        parent::__construct();
        if ($messageStruct !== null) {
            if (isset($messageStruct['tool']) && ! ($messageStruct['tool'] instanceof SuperAgentTool)) {
                $messageStruct['tool'] = new SuperAgentTool($messageStruct['tool']);
            }
            $this->initProperty($messageStruct);
        }
        $this->setMessageType();
    }

    public function getTopicId(): ?string
    {
        return $this->topicId;
    }

    public function setTopicId(?string $topicId): self
    {
        $this->topicId = $topicId;
        return $this;
    }

    public function getMessageId(): ?string
    {
        return $this->messageId;
    }

    public function setMessageId(?string $messageId): self
    {
        $this->messageId = $messageId;
        return $this;
    }

    public function getTaskId(): ?string
    {
        return $this->taskId;
    }

    public function setTaskId(?string $taskId): self
    {
        $this->taskId = $taskId;
        return $this;
    }

    public function getType(): ?string
    {
        return $this->type;
    }

    public function setType(?string $type): self
    {
        $this->type = $type;
        return $this;
    }

    public function getStatus(): ?string
    {
        return $this->status;
    }

    public function setStatus(?string $status): self
    {
        $this->status = $status;
        return $this;
    }

    public function getSteps(): ?array
    {
        return $this->steps;
    }

    public function setSteps(?array $steps): self
    {
        $this->steps = $steps;
        return $this;
    }

    public function getTool(): ?SuperAgentTool
    {
        return $this->tool;
    }

    public function setTool(?SuperAgentTool $tool): self
    {
        if ($tool !== null) {
            $this->tool = $tool;
        }
        return $this;
    }

    public function getSendTimestamp(): ?int
    {
        return $this->sendTimestamp;
    }

    public function setSendTimestamp(?int $sendTimestamp): self
    {
        $this->sendTimestamp = $sendTimestamp;
        return $this;
    }

    public function setEvent(?string $event): self
    {
        $this->event = $event;
        return $this;
    }

    public function getEvent(): ?string
    {
        return $this->event;
    }

    public function getRole(): ?string
    {
        return $this->role;
    }

    public function setRole(?string $role): self
    {
        $this->role = $role;
        return $this;
    }

    public function getAttachments(): ?array
    {
        return $this->attachments;
    }

    public function setAttachments(?array $attachments): self
    {
        $this->attachments = $attachments;
        return $this;
    }

    public function toArray(bool $filterNull = false): array
    {
        $data = array_merge(parent::toArray($filterNull), [
            'topic_id' => $this->topicId,
            'message_id' => $this->messageId,
            'task_id' => $this->taskId,
            'type' => $this->type,
            'status' => $this->status,
            'content' => $this->content,
            'event' => $this->event,
            'steps' => array_map(function ($step) {
                if ($step instanceof SuperAgentStep) {
                    return $step->toArray();
                }
                return (new SuperAgentStep($step))->toArray();
            }, $this->steps ?? []),
            'tool' => $this->tool?->toArray(),
            'role' => $this->role,
            'send_timestamp' => $this->sendTimestamp ?? time(),
            'attachments' => $this->attachments,
        ]);

        if ($filterNull) {
            $data = array_filter($data, fn ($value) => $value !== null);
        }

        return $data;
    }

    public function getTextContent(): string
    {
        return $this->content ?? '';
    }

    public function getContent(): string
    {
        return $this->getTextContent();
    }

    public function setContent(?string $content): static
    {
        $this->content = $content ?? '';
        return $this;
    }

    protected function setMessageType(): void
    {
        $this->chatMessageType = ChatMessageType::SuperAgentCard;
    }
}
