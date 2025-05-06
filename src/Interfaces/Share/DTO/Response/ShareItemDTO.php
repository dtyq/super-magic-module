<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Interfaces\Share\DTO\Response;

/**
 * 分享项目DTO.
 */
class ShareItemDTO
{
    /**
     * @var string 分享ID
     */
    public string $id = '';

    /**
     * @var string 资源ID
     */
    public string $resourceId = '';

    /**
     * @var int 资源类型
     */
    public int $resourceType = 0;

    /**
     * @var string 资源类型名称
     */
    public string $resourceTypeName = '';

    /**
     * @var string 分享代码
     */
    public string $shareCode = '';

    /**
     * @var bool 是否已设置密码
     */
    public bool $hasPassword = false;

    /**
     * @var int 分享类型
     */
    public int $shareType = 0;

    /**
     * 将DTO转换为数组.
     *
     * @return array 关联数组
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'resource_id' => $this->resourceId,
            'resource_type' => $this->resourceType,
            'resource_type_name' => $this->resourceTypeName,
            'share_code' => $this->shareCode,
            'has_password' => $this->hasPassword,
            'share_type' => $this->shareType,
        ];
    }
}
