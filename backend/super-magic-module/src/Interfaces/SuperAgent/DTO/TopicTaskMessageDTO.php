<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Interfaces\SuperAgent\DTO;

use Dtyq\SuperMagic\Domain\SuperAgent\Entity\ValueObject\MessageMetadata;
use Dtyq\SuperMagic\Domain\SuperAgent\Entity\ValueObject\MessagePayload;

/**
 * 话题任务消息DTO.
 */
class TopicTaskMessageDTO
{
    /**
     * 构造函数.
     *
     * @param MessageMetadata $metadata 消息元数据
     * @param MessagePayload $payload 消息负载
     */
    public function __construct(
        private MessageMetadata $metadata,
        private MessagePayload $payload
    ) {
    }

    /**
     * 从消息数据创建DTO实例.
     *
     * @param array $data 消息数据
     */
    public static function fromArray(array $data): self
    {
        $metadata = isset($data['metadata']) && is_array($data['metadata'])
            ? MessageMetadata::fromArray($data['metadata'])
            : new MessageMetadata();

        $payload = isset($data['payload']) && is_array($data['payload'])
            ? MessagePayload::fromArray($data['payload'])
            : new MessagePayload();

        return new self($metadata, $payload);
    }

    /**
     * 获取消息元数据.
     */
    public function getMetadata(): MessageMetadata
    {
        return $this->metadata;
    }

    /**
     * 设置消息元数据.
     *
     * @param MessageMetadata $metadata 消息元数据
     */
    public function setMetadata(MessageMetadata $metadata): self
    {
        $this->metadata = $metadata;
        return $this;
    }

    /**
     * 获取消息负载.
     */
    public function getPayload(): MessagePayload
    {
        return $this->payload;
    }

    /**
     * 设置消息负载.
     *
     * @param MessagePayload $payload 消息负载
     */
    public function setPayload(MessagePayload $payload): self
    {
        $this->payload = $payload;
        return $this;
    }

    /**
     * 转换为数组.
     */
    public function toArray(): array
    {
        return [
            'metadata' => $this->metadata->toArray(),
            'payload' => $this->payload->toArray(),
        ];
    }
}
