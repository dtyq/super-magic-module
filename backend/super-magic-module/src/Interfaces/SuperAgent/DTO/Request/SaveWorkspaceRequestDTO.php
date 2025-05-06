<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Interfaces\SuperAgent\DTO\Request;

use App\Infrastructure\Core\AbstractDTO;
use Hyperf\HttpServer\Contract\RequestInterface;

class SaveWorkspaceRequestDTO extends AbstractDTO
{
    public string $id = '';

    public string $workspace_name = '';

    /**
     * 获取验证规则.
     */
    public function rules(): array
    {
        return [
            'id' => 'nullable|string',
            'workspace_name' => 'required|string|max:100',
        ];
    }

    /**
     * 获取验证失败的自定义错误信息.
     */
    public function messages(): array
    {
        return [
            'workspace_name.required' => '工作区名称不能为空',
            'workspace_name.max' => '工作区名称不能超过100个字符',
        ];
    }

    /**
     * 从请求中创建DTO实例.
     */
    public static function fromRequest(RequestInterface $request): self
    {
        $data = new self();
        $data->id = $request->input('id', '');
        $data->workspace_name = $request->input('workspace_name', '');
        return $data;
    }

    /**
     * 获取工作区ID（如果存在）.
     */
    public function getWorkspaceId(): ?string
    {
        return $this->id ?: null;
    }

    /**
     * 获取工作区名称.
     */
    public function getWorkspaceName(): string
    {
        return $this->workspace_name;
    }

    /**
     * 是否为更新操作.
     */
    public function isUpdate(): bool
    {
        return ! empty($this->id);
    }
}
