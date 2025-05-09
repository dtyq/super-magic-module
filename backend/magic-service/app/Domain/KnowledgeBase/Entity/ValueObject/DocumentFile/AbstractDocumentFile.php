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

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): void
    {
        $this->name = $name;
    }

    public function getDocType(): DocType
    {
        return DocType::UNKNOWN;
    }
}
