<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Interfaces\Share\DTO\Request;

use App\Infrastructure\Core\AbstractDTO;
use Hyperf\HttpServer\Contract\RequestInterface;

/**
 * 访问分享请求DTO.
 */
class AccessShareRequestDTO extends AbstractDTO
{
    /**
     * 分享代码
     */
    public string $shareCode = '';

    /**
     * 访问密码
     */
    public ?string $password = null;

    /**
     * 访问来源.
     */
    public int $accessSource = 0;

    /**
     * 从请求中创建DTO.
     */
    public static function fromRequest(RequestInterface $request): self
    {
        $dto = new self();
        $dto->shareCode = (string) $request->input('share_code', '');
        $dto->password = $request->has('password') ? (string) $request->input('password') : null;
        $dto->accessSource = (int) $request->input('access_source', 0);

        return $dto;
    }

    /**
     * 获取分享代码
     */
    public function getShareCode(): string
    {
        return $this->shareCode;
    }

    /**
     * 获取访问密码
     */
    public function getPassword(): ?string
    {
        return $this->password;
    }

    /**
     * 获取访问来源.
     */
    public function getAccessSource(): int
    {
        return $this->accessSource;
    }

    /**
     * 构建验证规则.
     */
    public function rules(): array
    {
        return [
            'share_code' => 'required|string|max:16',
            'password' => 'nullable|string|max:32',
            'access_source' => 'nullable|integer|min:0',
        ];
    }

    /**
     * 获取验证错误消息.
     */
    public function messages(): array
    {
        return [
            'share_code.required' => '分享代码不能为空',
        ];
    }

    /**
     * 属性名称.
     */
    public function attributes(): array
    {
        return [
            'share_code' => '分享代码',
            'password' => '访问密码',
            'access_source' => '访问来源',
        ];
    }
}
