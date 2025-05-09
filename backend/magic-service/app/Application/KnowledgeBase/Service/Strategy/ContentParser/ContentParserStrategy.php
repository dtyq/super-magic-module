<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\KnowledgeBase\Service\Strategy\ContentParser;

use App\Application\KnowledgeBase\Service\Strategy\ContentParser\Driver\Interfaces\ExternalFileContentParserInterface;
use App\Application\KnowledgeBase\Service\Strategy\ContentParser\Driver\Interfaces\ThirdPlatformContentParserInterface;
use App\Domain\KnowledgeBase\Entity\ValueObject\DocumentFile\DocumentFileInterface;
use App\Domain\KnowledgeBase\Entity\ValueObject\DocumentFile\ExternalDocumentFile;
use App\Domain\KnowledgeBase\Entity\ValueObject\DocumentFile\ThirdPlatformDocumentFile;
use Hyperf\Logger\LoggerFactory;
use Psr\Log\LoggerInterface;

class ContentParserStrategy
{
    protected LoggerInterface $logger;

    public function __construct(LoggerFactory $loggerFactory)
    {
        $this->logger = $loggerFactory->get(get_class($this));
    }

    public function parse(DocumentFileInterface $documentFile): string
    {
        $interface = match (get_class($documentFile)) {
            ExternalDocumentFile::class => ExternalFileContentParserInterface::class,
            ThirdPlatformDocumentFile::class => ThirdPlatformContentParserInterface::class,
            default => null,
        };

        if (container()->has($interface) && di($interface)->validation($documentFile)) {
            return di($interface)->parse($documentFile);
        }
        $this->logger->warning('没有与[' . get_class($documentFile) . ']匹配的文本解析策略！将返回空值！');
        return '';
    }
}
