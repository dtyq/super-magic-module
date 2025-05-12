<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\KnowledgeBase\Service\Strategy\DocumentFile\Driver;

use App\Application\KnowledgeBase\Service\Strategy\DocumentFile\Driver\Interfaces\ThirdPlatformDocumentFileStrategyInterface;
use App\Domain\KnowledgeBase\Entity\ValueObject\DocType;
use App\Domain\KnowledgeBase\Entity\ValueObject\DocumentFile\DocumentFileInterface;
use App\Domain\KnowledgeBase\Entity\ValueObject\DocumentFile\ThirdPlatformDocumentFile;
use App\Domain\KnowledgeBase\Entity\ValueObject\KnowledgeBaseDataIsolation;

class ThirdPlatformDocumentFileStrategyDriver implements ThirdPlatformDocumentFileStrategyInterface
{
    public function parseContent(KnowledgeBaseDataIsolation $dataIsolation, DocumentFileInterface $documentFile): string
    {
        // 这里实现第三方文档文件的文本解析逻辑
        return '';
    }

    public function parseDocType(KnowledgeBaseDataIsolation $dataIsolation, DocumentFileInterface $documentFile): DocType
    {
        // 这里实现第三方文档文件的文本格式解析逻辑
        return DocType::UNKNOWN;
    }

    public function validation(DocumentFileInterface $documentFile): bool
    {
        return $documentFile instanceof ThirdPlatformDocumentFile;
    }
}
