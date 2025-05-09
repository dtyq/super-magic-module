<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\KnowledgeBase\Entity\ValueObject\DocumentFile;

use App\Domain\KnowledgeBase\Entity\ValueObject\DocType;

interface DocumentFileInterface
{
    public function getDocType(): DocType;

    public function getName(): string;
}
