<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\KnowledgeBase\Service\Strategy\DocumentFile\Driver\Interfaces;

use App\Domain\KnowledgeBase\Entity\ValueObject\DocType;
use App\Domain\KnowledgeBase\Entity\ValueObject\DocumentFile\DocumentFileInterface;
use App\Domain\KnowledgeBase\Entity\ValueObject\KnowledgeBaseDataIsolation;

interface BaseDocumentFileStrategyInterface
{
    public function validation(DocumentFileInterface $documentFile): bool;

    public function parseContent(KnowledgeBaseDataIsolation $dataIsolation, DocumentFileInterface $documentFile): string;

    public function parseDocType(KnowledgeBaseDataIsolation $dataIsolation, DocumentFileInterface $documentFile): DocType;
}
