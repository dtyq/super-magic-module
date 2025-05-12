<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\KnowledgeBase\Entity\ValueObject\DocumentFile;

use App\Domain\KnowledgeBase\Entity\ValueObject\DocType;
use App\Infrastructure\Core\AbstractValueObject;

abstract class AbstractDocumentFile extends AbstractValueObject implements DocumentFileInterface
{
    public string $name;

    public DocumentFileType $type;

    public ?DocType $docType = null;

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): void
    {
        $this->name = $name;
    }

    public function setType(mixed $type): static
    {
        return $this;
    }

    public function getType(): ?DocumentFileType
    {
        return $this->type;
    }

    public function getDocType(): ?DocType
    {
        return $this->docType;
    }

    public function setDocType(null|DocType|int $docType): static
    {
        is_int($docType) && $docType = DocType::from($docType);
        $this->docType = $docType;
        return $this;
    }

    public static function fromArray(array $data): ?DocumentFileInterface
    {
        $documentFileType = isset($data['type']) ? DocumentFileType::tryFrom($data['type']) : DocumentFileType::EXTERNAL;
        $data['type'] = $documentFileType;
        return match ($documentFileType) {
            DocumentFileType::EXTERNAL => new ExternalDocumentFile($data),
            DocumentFileType::THIRD_PLATFORM => new ThirdPlatformDocumentFile($data),
            default => null,
        };
    }
}
