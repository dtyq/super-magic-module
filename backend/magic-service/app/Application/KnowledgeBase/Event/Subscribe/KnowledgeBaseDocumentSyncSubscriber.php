<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\KnowledgeBase\Event\Subscribe;

use App\Application\KnowledgeBase\Service\Strategy\ContentParser\ContentParserStrategy;
use App\Domain\KnowledgeBase\Entity\KnowledgeBaseFragmentEntity;
use App\Domain\KnowledgeBase\Entity\ValueObject\KnowledgeBaseDataIsolation;
use App\Domain\KnowledgeBase\Entity\ValueObject\KnowledgeSyncStatus;
use App\Domain\KnowledgeBase\Event\KnowledgeBaseDocumentSavedEvent;
use App\Domain\KnowledgeBase\Service\KnowledgeBaseDocumentDomainService;
use App\Domain\KnowledgeBase\Service\KnowledgeBaseDomainService;
use App\Domain\KnowledgeBase\Service\KnowledgeBaseFragmentDomainService;
use App\Infrastructure\Core\Exception\BusinessException;
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
        /** @var ContentParserStrategy $contentParserStrategy */
        $contentParserStrategy = di(ContentParserStrategy::class);
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
                $documentEntity->setSyncStatus(KnowledgeSyncStatus::Syncing->value);
                $documentEntity = $knowledgeBaseDocumentDomainService->update($dataIsolation, $knowledge, $documentEntity);
                $logger->info('正在解析文件，文件名：' . $file->getName());
                $content = $contentParserStrategy->parse($file);
                $logger->info('解析文件完成，正在文件分段，文件名：' . $file->getName());
                $splitText = $knowledgeBaseFragmentDomainService->processFragmentsByContent($dataIsolation, $content, $documentEntity->getFragmentConfig());
                $logger->info('文件分段完成，文件名：' . $file->getName() . '，分段数量:' . count($splitText));

                foreach ($splitText as $text) {
                    $fragmentEntity = (new KnowledgeBaseFragmentEntity())
                        ->setKnowledgeCode($knowledge->getCode())
                        ->setDocumentCode($documentEntity->getCode())
                        ->setContent($text)
                        ->setCreator($documentEntity->getCreatedUid())
                        ->setModifier($documentEntity->getUpdatedUid());
                    $knowledgeBaseDocumentEntity = $knowledgeBaseDocumentDomainService->show($dataIsolation, $knowledge->getCode(), $fragmentEntity->getDocumentCode());
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
}
