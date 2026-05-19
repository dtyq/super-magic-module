<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Interfaces\SuperAgent\DTO\Response;

use App\Infrastructure\Core\AbstractDTO;

/**
 * 获取文件最新版本响应 DTO.
 */
class GetLatestFileVersionResponseDTO extends AbstractDTO
{
    protected int $fileId = 0;

    protected int $latestVersion = 1;

    public static function create(int $fileId, int $latestVersion): self
    {
        $dto = new self();
        $dto->fileId = $fileId;
        $dto->latestVersion = $latestVersion;

        return $dto;
    }

    public function toArray(): array
    {
        return [
            'file_id' => (string) $this->fileId,
            'latest_version' => $this->latestVersion,
        ];
    }
}
