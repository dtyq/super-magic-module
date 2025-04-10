<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\KnowledgeBase\Event\Subscribe;

use App\Domain\KnowledgeBase\Entity\KnowledgeBaseFragmentEntity;
use App\Domain\KnowledgeBase\Entity\ValueObject\KnowledgeBaseDataIsolation;
use App\Domain\KnowledgeBase\Entity\ValueObject\KnowledgeSyncStatus;
use App\Domain\KnowledgeBase\Event\KnowledgeBaseDocumentSavedEvent;
use App\Domain\KnowledgeBase\Service\KnowledgeBaseDocumentDomainService;
use App\Domain\KnowledgeBase\Service\KnowledgeBaseDomainService;
use App\Domain\KnowledgeBase\Service\KnowledgeBaseFragmentDomainService;
use App\Infrastructure\Core\Exception\BusinessException;
use App\Infrastructure\Core\File\Parser\FileParser;
use App\Infrastructure\Util\Odin\TextSplitter\TokenTextSplitter;
use Dtyq\AsyncEvent\Kernel\Annotation\AsyncListener;
use Hyperf\Event\Annotation\Listener;
use Hyperf\Event\Contract\ListenerInterface;
use Psr\Log\LoggerInterface;
use Throwable;

use function di;

#[AsyncListener]
#[Listener]
readonly class KnowledgeBaseDocumentSyncSubscriber implements ListenerInterface
{
    public function __construct()
    {
    }

    public function listen(): array
    {
        return [
            KnowledgeBaseDocumentSavedEvent::class,
        ];
    }

    public function process(object $event): void
    {
        if (! $event instanceof KnowledgeBaseDocumentSavedEvent) {
            return;
        }
        $knowledge = $event->knowledgeBaseEntity;
        $documentEntity = $event->knowledgeBaseDocumentEntity;
        $dataIsolation = KnowledgeBaseDataIsolation::create($knowledge->getOrganizationCode(), $knowledge->getCreator());
        /** @var KnowledgeBaseDocumentDomainService $knowledgeBaseDocumentDomainService */
        $knowledgeBaseDocumentDomainService = di(KnowledgeBaseDocumentDomainService::class);
        /** @var KnowledgeBaseDomainService $knowledgeBaseDomainService */
        $knowledgeBaseDomainService = di(KnowledgeBaseDomainService::class);
        /** @var KnowledgeBaseFragmentDomainService $knowledgeBaseFragmentDomainService */
        $knowledgeBaseFragmentDomainService = di(KnowledgeBaseFragmentDomainService::class);
        /** @var FileParser $fileParser */
        $fileParser = di(FileParser::class);
        /** @var LoggerInterface $logger */
        $logger = di(LoggerInterface::class);

        try {
            $vector = $knowledge->getVectorDBDriver();
            $collection = $vector->getCollection($knowledge->getCollectionName());
            if (! $collection) {
                throw new BusinessException('collection不存在');
            }

            $file = $event->documentFile;
            if ($file) {
                $tokenSplitter = new TokenTextSplitter(chunkSize: 500, chunkOverlap: 50);
                $documentEntity->setSyncStatus(KnowledgeSyncStatus::Syncing->value);
                $documentEntity = $knowledgeBaseDocumentDomainService->update($dataIsolation, $knowledge, $documentEntity);
                $logger->info('正在解析文件，文件名：' . $file->getName());
                $content = $fileParser->parse($file->getFileLink()->getUrl());
                // 检测并转换编码
                $encoding = $this->detectEncoding($content);
                $logger->info('检测到文件编码：' . $encoding);

                if ($encoding !== 'UTF-8') {
                    $content = mb_convert_encoding($content, 'UTF-8', $encoding);
                    $logger->info('已将内容从 ' . $encoding . ' 转换为 UTF-8');
                }

                $logger->info('解析文件完成，正在文件分段，文件名：' . $file->getName());
                $splitText = $tokenSplitter->splitText($content);
                // 过滤trim后为空的内容
                $splitText = array_filter($splitText, function ($text) {
                    return trim($text) !== '';
                });
                $logger->info('文件分段完成，文件名：' . $file->getName() . '，分段数量:' . count($splitText));

                foreach ($splitText as $text) {
                    $fragmentEntity = (new KnowledgeBaseFragmentEntity())
                        ->setKnowledgeCode($knowledge->getCode())
                        ->setDocumentCode($documentEntity->getCode())
                        ->setContent($text)
                        ->setCreator($documentEntity->getCreatedUid())
                        ->setModifier($documentEntity->getUpdatedUid());
                    $knowledgeBaseDocumentEntity = $knowledgeBaseDocumentDomainService->show($dataIsolation, $fragmentEntity->getDocumentCode());
                    $knowledgeBaseEntity = $knowledgeBaseDomainService->show($dataIsolation, $fragmentEntity->getKnowledgeCode());
                    $knowledgeBaseFragmentDomainService->save($dataIsolation, $knowledgeBaseEntity, $knowledgeBaseDocumentEntity, $fragmentEntity);
                }
            }

            $documentEntity->setSyncStatus(KnowledgeSyncStatus::Synced->value);
        } catch (Throwable $throwable) {
            $logger->error($throwable->getMessage() . PHP_EOL . $throwable->getTraceAsString());
            $documentEntity->setSyncStatus(KnowledgeSyncStatus::SyncFailed->value);
            $documentEntity->setSyncStatusMessage($throwable->getMessage());
        }
        $knowledgeBaseDocumentDomainService->changeSyncStatus($dataIsolation, $documentEntity);
    }

    /**
     * 检测文件内容的编码
     */
    private function detectEncoding(string $content): string
    {
        // 检查 BOM
        if (str_starts_with($content, "\xEF\xBB\xBF")) {
            return 'UTF-8';
        }
        if (str_starts_with($content, "\xFF\xFE")) {
            return 'UTF-16LE';
        }
        if (str_starts_with($content, "\xFE\xFF")) {
            return 'UTF-16BE';
        }

        // 尝试检测编码
        $encoding = mb_detect_encoding($content, ['UTF-8', 'GBK', 'GB2312', 'BIG5', 'ASCII'], true);
        if ($encoding === false) {
            // 如果无法检测到编码，尝试使用 iconv 检测
            $encoding = mb_detect_encoding($content, ['UTF-8', 'GBK', 'GB2312', 'BIG5', 'ASCII'], false);
            if ($encoding === false) {
                return 'UTF-8'; // 默认使用 UTF-8
            }
        }

        return $encoding;
    }
}
