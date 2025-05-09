<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\KnowledgeBase\Entity\ValueObject\DocumentFile;

use App\Domain\KnowledgeBase\Entity\ValueObject\DocType;
use App\Infrastructure\Util\FileType;
use Dtyq\CloudFile\Kernel\Struct\FileLink;

class ExternalDocumentFile extends AbstractDocumentFile
{
    public string $key;

    public ?FileLink $fileLink = null;

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

    public function setFileLink(null|array|FileLink $fileLink): static
    {
        is_array($fileLink) && $fileLink = new FileLink($fileLink['path'] ?? '', $fileLink['url'] ?? '', $fileLink['expires'] ?? 0, $fileLink['download_name'] ?? '');
        $this->fileLink = $fileLink;
        return $this;
    }

    public function getDocType(): DocType
    {
        $extension = FileType::getType($this->getFileLink()->getUrl());
        return DocType::fromExtension($extension);
    }
}
