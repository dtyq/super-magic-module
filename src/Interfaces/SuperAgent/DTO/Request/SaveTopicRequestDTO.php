<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Interfaces\SuperAgent\DTO\Request;

use App\Infrastructure\Core\AbstractDTO;
use Hyperf\HttpServer\Contract\RequestInterface;

/**
 * 保存话题请求DTO
 * 用于接收新增或更新话题的请求参数.
 */
class SaveTopicRequestDTO extends AbstractDTO
{
    /**
     * 话题ID，为空时表示新增
     * 字符串类型，对应任务状态表的主键.
     */
    public string $id = '';

    /**
     * 工作区ID.
     */
    public string $workspace_id = '';

    /**
     * 话题名称.
     */
    public string $topic_name = '';

    /**
     * 获取验证规则.
     */
    public function rules(): array
    {
        return [
            'id' => 'nullable|string',
            'workspace_id' => 'required|string',
            'topic_name' => 'required|string|max:100',
        ];
    }

    /**
     * 获取验证失败的自定义错误信息.
     */
    public function messages(): array
    {
        return [
            'workspace_id.required' => '工作区ID不能为空',
            'workspace_id.string' => '工作区ID必须是字符串',
            'topic_name.required' => '话题名称不能为空',
            'topic_name.max' => '话题名称不能超过100个字符',
        ];
    }

    /**
     * 从请求中创建DTO实例.
     */
    public static function fromRequest(RequestInterface $request): self
    {
        $data = new self();
        $data->id = $request->input('id', '');
        $data->workspace_id = $request->input('workspace_id', '');
        $data->topic_name = $request->input('topic_name', '');
        return $data;
    }

    /**
     * 获取任务状态ID(主键).
     */
    public function getId(): string
    {
        return $this->id;
    }

    /**
     * 获取工作区ID.
     */
    public function getWorkspaceId(): string
    {
        return $this->workspace_id;
    }

    /**
     * 获取话题名称.
     */
    public function getTopicName(): string
    {
        return $this->topic_name;
    }

    /**
     * 是否为更新操作.
     */
    public function isUpdate(): bool
    {
        return ! empty($this->id);
    }
}
