<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Interfaces\KnowledgeBase\DTO\DocumentFile;

class ThirdPlatformDocumentFileDTO extends AbstractDocumentFileDTO
{
    public string $platformType;

    public string $thirdFileId;

    public function getThirdFileId(): string
    {
        return $this->thirdFileId;
    }

    public function setThirdFileId(string $thirdFileId): void
    {
        $this->thirdFileId = $thirdFileId;
    }

    public function getPlatformType(): string
    {
        return $this->platformType;
    }

    public function setPlatformType(string $platformType): static
    {
        $this->platformType = $platformType;
        return $this;
    }
}
