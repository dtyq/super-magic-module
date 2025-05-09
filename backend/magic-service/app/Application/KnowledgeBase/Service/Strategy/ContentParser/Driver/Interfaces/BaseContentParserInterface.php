<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\KnowledgeBase\Service\Strategy\ContentParser\Driver\Interfaces;

use App\Domain\KnowledgeBase\Entity\ValueObject\DocumentFile\DocumentFileInterface;

interface BaseContentParserInterface
{
    public function validation(DocumentFileInterface $documentFile): bool;
}
