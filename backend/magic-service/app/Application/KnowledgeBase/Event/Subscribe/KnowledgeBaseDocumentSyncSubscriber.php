<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\KnowledgeBase\Event\Subscribe;

use App\Application\KnowledgeBase\Service\KnowledgeBaseVectorAppService;
use App\Domain\KnowledgeBase\Entity\ValueObject\KnowledgeBaseDataIsolation;
use App\Domain\KnowledgeBase\Entity\ValueObject\KnowledgeSyncStatus;
use App\Domain\KnowledgeBase\Event\KnowledgeBaseDocumentSavedEvent;
use App\Domain\KnowledgeBase\Service\KnowledgeBaseDocumentDomainService;
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
        if (! $event->create) {
            return;
        }
        $knowledge = $event->knowledgeBaseEntity;
        $documentEntity = $event->knowledgeBaseDocumentEntity;
        $dataIsolation = KnowledgeBaseDataIsolation::create($knowledge->getOrganizationCode(), $knowledge->getCreator());
        /** @var KnowledgeBaseDocumentDomainService $knowledgeBaseDocumentDomainService */
        $knowledgeBaseDocumentDomainService = di(KnowledgeBaseDocumentDomainService::class);
        /** @var LoggerInterface $logger */
        $logger = di(LoggerInterface::class);
        /** @var KnowledgeBaseVectorAppService $knowledgeBaseVectorAppService */
        $knowledgeBaseVectorAppService = di(KnowledgeBaseVectorAppService::class);

        try {
            // 检查集合是否存在
            $knowledgeBaseVectorAppService->checkCollectionExists($knowledge);
            // 同步文档
            $knowledgeBaseVectorAppService->syncDocument($dataIsolation, $knowledge, $documentEntity);
        } catch (Throwable $throwable) {
            $logger->error($throwable->getMessage() . PHP_EOL . $throwable->getTraceAsString());
            $documentEntity->setSyncStatus(KnowledgeSyncStatus::SyncFailed->value);
            $documentEntity->setSyncStatusMessage($throwable->getMessage());
            $knowledgeBaseDocumentDomainService->changeSyncStatus($dataIsolation, $documentEntity);
        }
    }
}
