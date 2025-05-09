<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\KnowledgeBase\Service\Strategy\ContentParser\Driver;

use App\Application\KnowledgeBase\Service\Strategy\ContentParser\Driver\Interfaces\ThirdPlatformContentParserInterface;
use App\Domain\KnowledgeBase\Entity\ValueObject\DocumentFile\DocumentFileInterface;
use App\Domain\KnowledgeBase\Entity\ValueObject\DocumentFile\ThirdPlatformDocumentFile;

class ThirdPlatformContentParserDriver implements ThirdPlatformContentParserInterface
{
    /**
     * @param ThirdPlatformDocumentFile $documentFile
     */
    public function parse(DocumentFileInterface $documentFile): string
    {
        // 这里实现第三方文档文件的文本解析逻辑
        return '';
    }

    public function validation(DocumentFileInterface $documentFile): bool
    {
        return $documentFile instanceof ThirdPlatformDocumentFile;
    }
}
