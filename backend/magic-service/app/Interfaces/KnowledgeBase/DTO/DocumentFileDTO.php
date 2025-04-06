<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Interfaces\KnowledgeBase\DTO;

use App\Infrastructure\Core\AbstractDTO;
use Dtyq\CloudFile\Kernel\Struct\FileLink;

class DocumentFileDTO extends AbstractDTO
{
    public string $name;

    public string $key;

    public ?FileLink $fileLink = null;

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): void
    {
        $this->name = $name;
    }

    public function getKey(): string
    {
        return $this->key;
    }

    public function setKey(string $key): void
    {
        $this->key = $key;
    }

    public function getFileLink(): ?FileLink
    {
        return $this->fileLink;
    }

    public function setFileLink(?FileLink $fileLink): void
    {
        $this->fileLink = $fileLink;
    }
}
