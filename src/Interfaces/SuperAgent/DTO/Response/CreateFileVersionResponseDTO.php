<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Interfaces\SuperAgent\DTO\Response;

use App\Infrastructure\Core\AbstractDTO;

/**
 * 创建文件版本响应 DTO.
 */
class CreateFileVersionResponseDTO extends AbstractDTO
{
    /**
     * 最新版本号.
     */
    protected int $latestVersion = 1;

    /**
     * 创建响应实例.
     */
    public static function create(int $latestVersion): self
    {
        $dto = new self();
        $dto->latestVersion = $latestVersion;

        return $dto;
    }

    /**
     * 转换为数组.
     */
    public function toArray(): array
    {
        return [
            'latest_version' => $this->latestVersion,
        ];
    }
}
