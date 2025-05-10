<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\KnowledgeBase\Service\Strategy\DocumentFile\Driver;

use App\Application\KnowledgeBase\Service\Strategy\DocumentFile\Driver\Interfaces\ExternalFileDocumentFileStrategyInterface;
use App\Domain\File\Service\FileDomainService;
use App\Domain\KnowledgeBase\Entity\ValueObject\DocType;
use App\Domain\KnowledgeBase\Entity\ValueObject\DocumentFile\DocumentFileInterface;
use App\Domain\KnowledgeBase\Entity\ValueObject\DocumentFile\ExternalDocumentFile;
use App\Domain\KnowledgeBase\Entity\ValueObject\KnowledgeBaseDataIsolation;
use App\Infrastructure\Core\File\Parser\FileParser;
use App\Infrastructure\Util\FileType;
use App\Infrastructure\Util\SSRF\Exception\SSRFException;
use Dtyq\CloudFile\Kernel\Struct\FileLink;

class ExternalFileDocumentFileStrategyDriver implements ExternalFileDocumentFileStrategyInterface
{
    /**
     * @param ExternalDocumentFile $documentFile
     * @throws SSRFException
     */
    public function parseContent(KnowledgeBaseDataIsolation $dataIsolation, DocumentFileInterface $documentFile): string
    {
        $fileLink = $this->getFileLink($dataIsolation->getCurrentOrganizationCode(), $documentFile->getKey());
        return di(FileParser::class)->parse($fileLink->getUrl());
    }

    /**
     * @param ExternalDocumentFile $documentFile
     */
    public function parseDocType(KnowledgeBaseDataIsolation $dataIsolation, DocumentFileInterface $documentFile): DocType
    {
        if (! $documentFile->getDocType()) {
            $fileLink = $this->getFileLink($dataIsolation->getCurrentOrganizationCode(), $documentFile->getKey());
            $extension = FileType::getType($fileLink->getUrl());
            $documentFile->setDocType(DocType::fromExtension($extension));
        }
        return $documentFile->getDocType();
    }

    public function validation(DocumentFileInterface $documentFile): bool
    {
        return $documentFile instanceof ExternalDocumentFile;
    }

    private function getFileLink(string $organizationCode, string $icon): ?FileLink
    {
        return di(FileDomainService::class)->getLink($organizationCode, $icon);
    }
}
