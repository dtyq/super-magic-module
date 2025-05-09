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
        return match (DocumentFileType::tryFrom($data['type'])) {
            DocumentFileType::EXTERNAL => new ExternalDocumentFileDTO($data),
            DocumentFileType::THIRD_PLATFORM => new ThirdPlatformDocumentFileDTO($data),
            default => ExceptionBuilder::throw(FlowErrorCode::KnowledgeValidateFailed),
        };
    }
}
