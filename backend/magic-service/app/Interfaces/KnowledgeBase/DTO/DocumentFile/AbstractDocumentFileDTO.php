<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Interfaces\KnowledgeBase\DTO\DocumentFile;

use App\Domain\KnowledgeBase\Entity\ValueObject\DocumentFile\DocumentFileType;
use App\ErrorCode\FlowErrorCode;
use App\Infrastructure\Core\AbstractDTO;
use App\Infrastructure\Core\Exception\ExceptionBuilder;

abstract class AbstractDocumentFileDTO extends AbstractDTO implements DocumentFileDTOInterface
{
    public DocumentFileType $type;

    public string $name;

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): void
    {
        $this->name = $name;
    }

    public static function fromArray(array $data): DocumentFileDTOInterface
    {
        $documentFileType = isset($data['type']) ? DocumentFileType::tryFrom($data['type']) : DocumentFileType::EXTERNAL;
        return match ($documentFileType) {
            DocumentFileType::EXTERNAL => new ExternalDocumentFileDTO($data),
            DocumentFileType::THIRD_PLATFORM => new ThirdPlatformDocumentFileDTO($data),
            default => ExceptionBuilder::throw(FlowErrorCode::KnowledgeValidateFailed),
        };
    }

    public function getType(): DocumentFileType
    {
        return $this->type;
    }

    public function setType(null|DocumentFileType|int $type): static
    {
        is_int($type) && $type = DocumentFileType::tryFrom($type);
        $this->type = $type;
        return $this;
    }
}
