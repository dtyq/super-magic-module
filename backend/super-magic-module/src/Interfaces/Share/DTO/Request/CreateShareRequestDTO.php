<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Interfaces\Share\DTO\Request;

use App\Infrastructure\Core\AbstractDTO;
use Dtyq\SuperMagic\Domain\Share\Constant\ResourceType;
use Dtyq\SuperMagic\Domain\Share\Constant\ShareAccessType;
use Hyperf\HttpServer\Contract\RequestInterface;

/**
 * 创建分享请求DTO.
 */
class CreateShareRequestDTO extends AbstractDTO
{
    /**
     * 资源ID.
     */
    public string $resourceId = '';

    /**
     * 资源类型.
     */
    public int $resourceType = 0;

    /**
     * 分享类型.
     */
    public int $shareType = 0;

    /**
     * 密码
     */
    public ?string $password = null;

    /**
     * 过期天数.
     */
    public ?int $expireDays = null;

    /**
     * 目标ID列表.
     */
    public array $targetIds = [];

    /**
     * 从请求中创建DTO.
     */
    public static function fromRequest(RequestInterface $request): self
    {
        $dto = new self();
        $dto->resourceId = (string) $request->input('resource_id', '');
        $dto->resourceType = (int) $request->input('resource_type', 0);
        $dto->shareType = (int) $request->input('share_type', 0);
        $dto->password = $request->has('pwd') ? (string) $request->input('pwd') : null;
        $dto->expireDays = $request->has('expire_days') ? (int) $request->input('expire_days') : null;
        $dto->targetIds = $request->input('target_ids', []);

        return $dto;
    }

    /**
     * 获取资源ID.
     */
    public function getResourceId(): string
    {
        return $this->resourceId;
    }

    /**
     * 获取资源类型.
     */
    public function getResourceType(): ResourceType
    {
        return ResourceType::from($this->resourceType);
    }

    /**
     * 获取分享类型.
     */
    public function getShareType(): ShareAccessType
    {
        return ShareAccessType::from($this->shareType);
    }

    /**
     * 获取密码
     */
    public function getPassword(): ?string
    {
        return $this->password;
    }

    /**
     * 获取过期天数.
     */
    public function getExpireDays(): ?int
    {
        return $this->expireDays;
    }

    /**
     * 获取目标ID列表.
     */
    public function getTargetIds(): array
    {
        return $this->targetIds;
    }

    /**
     * 构建验证规则.
     */
    public function rules(): array
    {
        return [
            'resource_id' => 'required|string|max:64',
            'resource_type' => 'required|integer|min:1',
            'share_type' => 'required|integer|min:1|max:4',
            'password' => 'nullable|string|min:4|max:32',
            'expire_days' => 'nullable|integer|min:1|max:365',
            'target_ids' => 'nullable|array',
            'target_ids.*.type' => 'required_with:target_ids|integer|min:1|max:3',
            'target_ids.*.id' => 'required_with:target_ids|string|max:64',
        ];
    }

    /**
     * 获取验证错误消息.
     */
    public function messages(): array
    {
        return [
            'resource_id.required' => '资源ID不能为空',
            'resource_type.required' => '资源类型不能为空',
            'share_type.required' => '分享类型不能为空',
            'password.min' => '密码长度至少为4位',
            'expire_days.min' => '有效期最少为1天',
            'expire_days.max' => '有效期最多为365天',
        ];
    }

    /**
     * 属性名称.
     */
    public function attributes(): array
    {
        return [
            'resource_id' => '资源ID',
            'resource_type' => '资源类型',
            'share_type' => '分享类型',
            'password' => '密码',
            'expire_days' => '过期天数',
            'target_ids' => '目标ID列表',
        ];
    }
}
