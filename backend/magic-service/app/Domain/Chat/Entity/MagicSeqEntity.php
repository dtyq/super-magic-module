<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\Chat\Entity;

use App\Domain\Chat\DTO\Message\EmptyMessage;
use App\Domain\Chat\DTO\Message\MessageInterface;
use App\Domain\Chat\Entity\Items\ReceiveList;
use App\Domain\Chat\Entity\Items\SeqExtra;
use App\Domain\Chat\Entity\ValueObject\ConversationType;
use App\Domain\Chat\Entity\ValueObject\MagicMessageStatus;
use App\Domain\Chat\Entity\ValueObject\MessageType\ChatMessageType;
use App\Domain\Chat\Entity\ValueObject\MessageType\ControlMessageType;
use App\Interfaces\Chat\Assembler\SeqAssembler;
use Hyperf\Codec\Json;

/**
 * 账号收件箱的序列号表,每个账号的所有消息必须单调递增.
 */
final class MagicSeqEntity extends AbstractEntity
{
    protected string $id = '';

    protected string $organizationCode = '';

    protected ConversationType $objectType;

    // object_type 为0或者1时,此处代表 magic_id
    protected string $objectId = '';

    protected string $seqId = '';

    // 序列号类型
    protected ChatMessageType|ControlMessageType $seqType;

    /**
     * 序列号内容.
     */
    protected MessageInterface $content;

    // magic message id
    protected string $magicMessageId = '';

    protected string $messageId = '';

    // refer
    protected string $referMessageId = '';

    // sender
    protected string $senderMessageId = '';

    protected string $conversationId = '';

    protected ?MagicMessageStatus $status = null;

    /**
     * 消息接收人列表.
     */
    protected ?ReceiveList $receiveList = null;

    protected string $createdAt = '';

    protected ?string $updatedAt = null;

    protected ?SeqExtra $extra = null;

    protected string $appMessageId = '';

    public function __construct(?array $data = [])
    {
        if ($data) {
            // 处理消息的内容类型转换
            if (! empty($data['content'])) {
                if (is_string($data['content'])) {
                    $data['content'] = Json::decode($data['content']);
                }
                $seqInterface = SeqAssembler::getSeqStructByArray($data['seq_type'], $data['content']);
                $data['content'] = $seqInterface;
            } else {
                $data['content'] = new EmptyMessage();
            }
            parent::__construct($data);
        }
    }

    public function getId(): string
    {
        return $this->id;
    }

    public function setId(int|string $id): self
    {
        if (is_int($id)) {
            $id = (string) $id;
        }
        $this->id = $id;
        return $this;
    }

    public function getSeqType(): ChatMessageType|ControlMessageType
    {
        return $this->seqType;
    }

    public function setSeqType(ChatMessageType|ControlMessageType|string $seqType): self
    {
        if (is_string($seqType)) {
            $typeEnum = ChatMessageType::tryFrom($seqType);
            if ($typeEnum === null) {
                $seqType = ControlMessageType::tryFrom($seqType);
            } else {
                $seqType = $typeEnum;
            }
        }
        $this->seqType = $seqType;
        return $this;
    }

    public function getContent(): MessageInterface
    {
        return $this->content;
    }

    public function setContent(MessageInterface $content): self
    {
        $this->content = $content;
        return $this;
    }

    public function getMagicMessageId(): string
    {
        return $this->magicMessageId;
    }

    public function setMagicMessageId(string $magicMessageId): self
    {
        $this->magicMessageId = $magicMessageId;
        return $this;
    }

    public function getReferMessageId(): string
    {
        return $this->referMessageId;
    }

    public function setReferMessageId(int|string $referMessageId): self
    {
        if (is_int($referMessageId)) {
            $referMessageId = (string) $referMessageId;
        }
        $this->referMessageId = $referMessageId;
        return $this;
    }

    public function getSenderMessageId(): string
    {
        return $this->senderMessageId;
    }

    public function setSenderMessageId(int|string $senderMessageId): self
    {
        if (is_int($senderMessageId)) {
            $senderMessageId = (string) $senderMessageId;
        }
        $this->senderMessageId = $senderMessageId;
        return $this;
    }

    public function getOrganizationCode(): string
    {
        return $this->organizationCode;
    }

    public function setOrganizationCode(string $organizationCode): self
    {
        $this->organizationCode = $organizationCode;
        return $this;
    }

    public function getObjectType(): ConversationType
    {
        return $this->objectType;
    }

    public function setObjectType(ConversationType|int $objectType): self
    {
        if (is_int($objectType)) {
            $objectType = ConversationType::tryFrom($objectType);
        }
        $this->objectType = $objectType;
        return $this;
    }

    public function getObjectId(): string
    {
        return $this->objectId;
    }

    public function setObjectId(int|string $objectId): self
    {
        if (is_int($objectId)) {
            $objectId = (string) $objectId;
        }
        $this->objectId = $objectId;
        return $this;
    }

    public function getSeqId(): string
    {
        return $this->seqId;
    }

    public function setSeqId(int|string $seqId): self
    {
        if (is_int($seqId)) {
            $seqId = (string) $seqId;
        }
        $this->seqId = $seqId;
        return $this;
    }

    public function getMessageId(): string
    {
        return $this->messageId;
    }

    public function setMessageId(int|string $messageId): self
    {
        if (is_int($messageId)) {
            $messageId = (string) $messageId;
        }
        $this->messageId = $messageId;
        return $this;
    }

    public function getConversationId(): string
    {
        return $this->conversationId;
    }

    public function setConversationId(int|string $conversationId): self
    {
        if (is_int($conversationId)) {
            $conversationId = (string) $conversationId;
        }
        $this->conversationId = $conversationId;
        return $this;
    }

    public function getStatus(): ?MagicMessageStatus
    {
        return $this->status;
    }

    public function setStatus(null|int|MagicMessageStatus $status): self
    {
        if (is_int($status)) {
            $status = MagicMessageStatus::tryFrom($status);
        }
        $this->status = $status;
        return $this;
    }

    public function getCreatedAt(): string
    {
        return $this->createdAt;
    }

    public function setCreatedAt(string $createdAt): self
    {
        $this->createdAt = $createdAt;
        return $this;
    }

    public function getUpdatedAt(): ?string
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(?string $updatedAt): self
    {
        $this->updatedAt = $updatedAt;
        return $this;
    }

    public function getReceiveList(): ?ReceiveList
    {
        return $this->receiveList;
    }

    public function setReceiveList(null|array|ReceiveList|string $receiveList): self
    {
        if ($receiveList instanceof ReceiveList) {
            $this->receiveList = $receiveList;
            return $this;
        }
        // 解析消息接收人列表.
        if (is_string($receiveList) && $receiveList !== '') {
            $receiveList = Json::decode($receiveList);
        }
        // 对于收件人来说,不需要记录消息接收人列表
        if (empty($receiveList)) {
            $receiveListObj = null;
        } elseif (is_array($receiveList)) {
            $receiveListObj = new ReceiveList();
            $receiveListObj->setReadList($receiveList['read_list'] ?? []);
            $receiveListObj->setUnreadList($receiveList['unread_list'] ?? []);
            $receiveListObj->setSeenList($receiveList['seen_list'] ?? []);
        } else {
            $receiveListObj = $receiveList;
        }
        $this->receiveList = $receiveListObj;
        return $this;
    }

    public function getExtra(): ?SeqExtra
    {
        return $this->extra;
    }

    public function setExtra(null|array|SeqExtra|string $extra): self
    {
        if (is_string($extra) && $extra !== '') {
            $extra = Json::decode($extra);
        }
        if (empty($extra)) {
            $extraObj = null;
        } elseif (is_array($extra)) {
            $extraObj = new SeqExtra($extra);
        } else {
            $extraObj = $extra;
        }
        $this->extra = $extraObj;
        return $this;
    }

    public function getAppMessageId(): string
    {
        return $this->appMessageId;
    }

    public function setAppMessageId(string $appMessageId): self
    {
        $this->appMessageId = $appMessageId;
        return $this;
    }

    public function toArray(): array
    {
        $data = parent::toArray();
        $data['seq_type'] = $this->getSeqType()->getName();
        $data['content'] = $this->getContent()->toArray();
        if ($this->getReceiveList() === null) {
            $data['receive_list'] = [];
        } else {
            $data['receive_list'] = $this->receiveList->toArray();
        }
        if ($this->getExtra() === null) {
            $data['extra'] = [];
        } else {
            $data['extra'] = $this->extra->toArray();
        }
        return $data;
    }

    public function canTriggerFlowOperateConversationStatus(): bool
    {
        return ! $this->isIgnoreMessageEntity();
    }

    public function isIgnoreMessageEntity(): bool
    {
        return in_array($this->seqType, [ControlMessageType::AddFriendSuccess, ControlMessageType::OpenConversation]);
    }

    public function canTriggerFlow(): bool
    {
        return in_array($this->seqType, [ControlMessageType::AddFriendSuccess, ControlMessageType::OpenConversation]);
    }
}
