<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Domain\SuperAgent\Entity\ValueObject;

/**
 * 消息元数据值对象.
 */
class MessageMetadata
{
    /**
     * 构造函数.
     *
     * @param string $agentUserId 智能体用户ID
     * @param string $userId 用户ID
     * @param string $organizationCode 组织代码
     * @param string $chatConversationId 聊天会话ID
     * @param string $chatTopicId 聊天话题ID
     * @param string $instruction 指令
     * @param string $sandboxId 沙箱ID
     * @param string $superMagicTaskId 超级助手任务ID
     */
    public function __construct(
        private string $agentUserId = '',
        private string $userId = '',
        private string $organizationCode = '',
        private string $chatConversationId = '',
        private string $chatTopicId = '',
        private string $instruction = '',
        private string $sandboxId = '',
        private string $superMagicTaskId = ''
    ) {
    }

    /**
     * 从数组创建元数据对象.
     *
     * @param array $data 元数据数组
     */
    public static function fromArray(array $data): self
    {
        return new self(
            $data['agent_user_id'] ?? '',
            $data['user_id'] ?? '',
            $data['organization_code'] ?? '',
            $data['chat_conversation_id'] ?? '',
            $data['chat_topic_id'] ?? '',
            $data['instruction'] ?? '',
            $data['sandbox_id'] ?? '',
            $data['super_magic_task_id'] ?? ''
        );
    }

    /**
     * 转换为数组.
     *
     * @return array 元数据数组
     */
    public function toArray(): array
    {
        return [
            'agent_user_id' => $this->agentUserId,
            'user_id' => $this->userId,
            'organization_code' => $this->organizationCode,
            'chat_conversation_id' => $this->chatConversationId,
            'chat_topic_id' => $this->chatTopicId,
            'instruction' => $this->instruction,
            'sandbox_id' => $this->sandboxId,
            'super_magic_task_id' => $this->superMagicTaskId,
        ];
    }

    // Getters
    public function getAgentUserId(): string
    {
        return $this->agentUserId;
    }

    public function getUserId(): string
    {
        return $this->userId;
    }

    public function getOrganizationCode(): string
    {
        return $this->organizationCode;
    }

    public function getChatConversationId(): string
    {
        return $this->chatConversationId;
    }

    public function getChatTopicId(): string
    {
        return $this->chatTopicId;
    }

    public function getInstruction(): string
    {
        return $this->instruction;
    }

    public function getSandboxId(): string
    {
        return $this->sandboxId;
    }

    public function getSuperMagicTaskId(): string
    {
        return $this->superMagicTaskId;
    }

    // Withers for immutability
    public function withAgentUserId(string $agentUserId): self
    {
        $clone = clone $this;
        $clone->agentUserId = $agentUserId;
        return $clone;
    }

    public function withUserId(string $userId): self
    {
        $clone = clone $this;
        $clone->userId = $userId;
        return $clone;
    }

    public function withOrganizationCode(string $organizationCode): self
    {
        $clone = clone $this;
        $clone->organizationCode = $organizationCode;
        return $clone;
    }

    public function withChatConversationId(string $chatConversationId): self
    {
        $clone = clone $this;
        $clone->chatConversationId = $chatConversationId;
        return $clone;
    }

    public function withChatTopicId(string $chatTopicId): self
    {
        $clone = clone $this;
        $clone->chatTopicId = $chatTopicId;
        return $clone;
    }

    public function withInstruction(string $instruction): self
    {
        $clone = clone $this;
        $clone->instruction = $instruction;
        return $clone;
    }

    public function withSandboxId(string $sandboxId): self
    {
        $clone = clone $this;
        $clone->sandboxId = $sandboxId;
        return $clone;
    }

    public function withSuperMagicTaskId(string $superMagicTaskId): self
    {
        $clone = clone $this;
        $clone->superMagicTaskId = $superMagicTaskId;
        return $clone;
    }
}
