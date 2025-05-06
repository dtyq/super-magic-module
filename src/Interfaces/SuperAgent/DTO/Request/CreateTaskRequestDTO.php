<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Interfaces\SuperAgent\DTO\Request;

use Hyperf\Validation\Request\FormRequest;

class CreateTaskRequestDTO extends FormRequest
{
    /**
     * @var string 聊天话题ID
     */
    protected string $chatTopicId = '';

    /**
     * @var string 任务提示词
     */
    protected string $prompt = '';

    /**
     * @var null|string 附件信息（JSON格式）
     */
    protected ?string $attachments = null;

    /**
     * 验证规则.
     */
    public function rules(): array
    {
        return [
            'chat_topic_id' => 'required|string',
            'prompt' => 'required|string',
            'attachments' => 'nullable|string',
        ];
    }

    /**
     * 属性名称.
     */
    public function attributes(): array
    {
        return [
            'chat_topic_id' => '聊天话题ID',
            'prompt' => '提示词',
            'attachments' => '附件信息',
        ];
    }

    public function getChatTopicId(): string
    {
        return $this->chatTopicId;
    }

    public function getPrompt(): string
    {
        return $this->prompt;
    }

    public function getAttachments(): ?string
    {
        return $this->attachments;
    }

    /**
     * 准备数据.
     */
    protected function prepareForValidation(): void
    {
        $this->chatTopicId = (string) $this->input('chat_topic_id', '');
        $this->prompt = (string) $this->input('prompt', '');
        $this->attachments = $this->has('attachments') ? (string) $this->input('attachments') : null;
    }
}
