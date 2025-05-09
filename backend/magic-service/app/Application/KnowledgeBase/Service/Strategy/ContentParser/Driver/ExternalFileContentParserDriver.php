<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\KnowledgeBase\Service\Strategy\ContentParser\Driver;

use App\Application\KnowledgeBase\Service\Strategy\ContentParser\Driver\Interfaces\ExternalFileContentParserInterface;
use App\Domain\KnowledgeBase\Entity\ValueObject\DocumentFile\DocumentFileInterface;
use App\Domain\KnowledgeBase\Entity\ValueObject\DocumentFile\ExternalDocumentFile;
use App\Infrastructure\Core\File\Parser\FileParser;
use App\Infrastructure\Util\SSRF\Exception\SSRFException;

class ExternalFileContentParserDriver implements ExternalFileContentParserInterface
{
    /**
     * @param ExternalDocumentFile $documentFile
     * @throws SSRFException
     */
    public function parse(DocumentFileInterface $documentFile): string
    {
        return di(FileParser::class)->parse($documentFile->getFileLink()->getUrl());
    }

    public function validation(DocumentFileInterface $documentFile): bool
    {
        return $documentFile instanceof ExternalDocumentFile;
    }
}
