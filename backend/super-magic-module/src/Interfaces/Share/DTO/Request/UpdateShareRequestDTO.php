<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Interfaces\Share\DTO\Request;

use App\Infrastructure\Core\AbstractDTO;
use Dtyq\SuperMagic\Domain\Share\Constant\ShareAccessType;
use Hyperf\HttpServer\Contract\RequestInterface;

/**
 * 更新分享请求DTO.
 */
class UpdateShareRequestDTO extends AbstractDTO
{
    /**
     * 分享ID.
     */
    public string $shareId = '';

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
        $dto->shareId = (string) $request->input('share_id', '');
        $dto->shareType = (int) $request->input('share_type', 0);
        $dto->password = $request->has('password') ? (string) $request->input('password') : null;
        $dto->expireDays = $request->has('expire_days') ? (int) $request->input('expire_days') : null;
        $dto->targetIds = $request->input('target_ids', []);

        return $dto;
    }

    /**
     * 获取分享ID.
     */
    public function getShareId(): string
    {
        return $this->shareId;
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
            'share_id' => 'required|string|max:64',
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
            'share_id.required' => '分享ID不能为空',
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
            'share_id' => '分享ID',
            'share_type' => '分享类型',
            'password' => '密码',
            'expire_days' => '过期天数',
            'target_ids' => '目标ID列表',
        ];
    }
}
