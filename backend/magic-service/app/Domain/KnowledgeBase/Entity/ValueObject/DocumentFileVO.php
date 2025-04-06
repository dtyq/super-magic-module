<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\KnowledgeBase\Entity\ValueObject;

use App\Infrastructure\Core\AbstractDTO;
use App\Interfaces\KnowledgeBase\DTO\DocumentFileDTO;
use Dtyq\CloudFile\Kernel\Struct\FileLink;

class DocumentFileVO extends AbstractDTO
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

    public function setFileLink(null|array|FileLink $fileLink): static
    {
        is_array($fileLink) && $fileLink = new FileLink($fileLink['path'] ?? '', $fileLink['url'] ?? '', $fileLink['expires'] ?? 0, $fileLink['download_name'] ?? '');
        $this->fileLink = $fileLink;
        return $this;
    }

    public static function fromDTO(?DocumentFileDTO $dto): ?DocumentFileVO
    {
        if ($dto === null) {
            return null;
        }
        $data = $dto->toArray();
        unset($data['file_link']);
        return (new self($data))->setFileLink($dto->getFileLink());
    }

    /**
     * @param array<DocumentFileDTO> $dtoList
     * @return array<DocumentFileVO>
     */
    public static function fromDTOList(array $dtoList): array
    {
        return array_map(fn (DocumentFileDTO $dto) => self::fromDTO($dto), $dtoList);
    }
}
