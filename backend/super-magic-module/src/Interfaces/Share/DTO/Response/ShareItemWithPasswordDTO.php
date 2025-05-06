<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Interfaces\Share\DTO\Response;

/**
 * 带密码的分享项目DTO.
 * 该DTO仅用于需要返回密码的特定接口.
 */
class ShareItemWithPasswordDTO extends ShareItemDTO
{
    /**
     * @var string 分享密码（明文）
     */
    public string $pwd = '';

    /**
     * 从基础DTO创建带密码的DTO.
     *
     * @param ShareItemDTO $baseDto 基础DTO
     * @param string $password 解密后的密码
     */
    public static function fromBaseDto(ShareItemDTO $baseDto, string $password): self
    {
        $dto = new self();
        $dto->id = $baseDto->id;
        $dto->resourceId = $baseDto->resourceId;
        $dto->resourceType = $baseDto->resourceType;
        $dto->resourceTypeName = $baseDto->resourceTypeName;
        $dto->shareCode = $baseDto->shareCode;
        $dto->hasPassword = $baseDto->hasPassword;
        $dto->pwd = $password;
        $dto->shareType = $baseDto->shareType;

        return $dto;
    }

    /**
     * 将DTO转换为数组.
     *
     * @return array 关联数组
     */
    public function toArray(): array
    {
        $data = parent::toArray();
        $data['pwd'] = $this->pwd;

        return $data;
    }
}
