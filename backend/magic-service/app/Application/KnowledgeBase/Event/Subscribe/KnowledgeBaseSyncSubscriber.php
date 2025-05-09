<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\KnowledgeBase\Event\Subscribe;

use App\Application\ModelGateway\Mapper\ModelGatewayMapper;
use App\Domain\KnowledgeBase\Entity\KnowledgeBaseDocumentEntity;
use App\Domain\KnowledgeBase\Entity\ValueObject\KnowledgeBaseDataIsolation;
use App\Domain\KnowledgeBase\Entity\ValueObject\KnowledgeSyncStatus;
use App\Domain\KnowledgeBase\Event\KnowledgeBaseSavedEvent;
use App\Domain\KnowledgeBase\Service\KnowledgeBaseDocumentDomainService;
use App\Domain\KnowledgeBase\Service\KnowledgeBaseDomainService;
use Hyperf\Event\Annotation\Listener;
use Hyperf\Event\Contract\ListenerInterface;
use Psr\Container\ContainerInterface;
use Psr\Log\LoggerInterface;
use Throwable;

#[Listener]
readonly class KnowledgeBaseSyncSubscriber implements ListenerInterface
{
    public function __construct(private ContainerInterface $container)
    {
    }

    public function listen(): array
    {
        return [
            KnowledgeBaseSavedEvent::class,
        ];
    }

    public function process(object $event): void
    {
        if (! $event instanceof KnowledgeBaseSavedEvent) {
            return;
        }
        $knowledge = $event->magicFlowKnowledgeEntity;
        $dataIsolation = KnowledgeBaseDataIsolation::create($knowledge->getOrganizationCode(), $knowledge->getCreator());
        /** @var KnowledgeBaseDomainService $knowledgeBaseDomainService */
        $knowledgeBaseDomainService = $this->container->get(KnowledgeBaseDomainService::class);

        /** @var KnowledgeBaseDocumentDomainService $knowledgeBaseDocumentDomainService */
        $knowledgeBaseDocumentDomainService = di(KnowledgeBaseDocumentDomainService::class);

        /** @var LoggerInterface $logger */
        $logger = di(LoggerInterface::class);

        $changed = false;
        try {
            $vector = $knowledge->getVectorDBDriver();
            $collection = $vector->getCollection($knowledge->getCollectionName());
            if (! $collection) {
                $knowledge->setSyncStatus(KnowledgeSyncStatus::Syncing);
                $knowledgeBaseDomainService->changeSyncStatus($knowledge);

                $model = $this->container->get(ModelGatewayMapper::class)->getEmbeddingModelProxy($knowledge->getModel(), $knowledge->getOrganizationCode());
                $vector->createCollection($knowledge->getCollectionName(), $model->getVectorSize());
                $knowledge->setSyncStatus(KnowledgeSyncStatus::Synced);
                $changed = true;
            }
            // 根据files批量创建文档
            $files = $event->documentFiles;
            foreach ($files as $file) {
                $documentEntity = (new KnowledgeBaseDocumentEntity())
                    ->setKnowledgeBaseCode($knowledge->getCode())
                    ->setName($file->getName())
                    ->setCreatedUid($knowledge->getCreator())
                    ->setUpdatedUid($knowledge->getCreator())
                    ->setEmbeddingModel($knowledge->getModel())
                    ->setFragmentConfig($knowledge->getFragmentConfig())
                    ->setEmbeddingConfig($knowledge->getEmbeddingConfig())
                    ->setRetrieveConfig($knowledge->getRetrieveConfig())
                    ->setVectorDb($knowledge->getVectorDb());
                $knowledgeBaseDocumentDomainService->create($dataIsolation, $knowledge, $documentEntity, $file);
            }
        } catch (Throwable $throwable) {
            $logger->error($throwable->getMessage() . PHP_EOL . $throwable->getTraceAsString());
            $knowledge->setSyncStatus(KnowledgeSyncStatus::SyncFailed);
            $knowledge->setSyncStatusMessage($throwable->getMessage());
            // 同步失败，回退版本
            $knowledge->setVersion(max(1, $knowledge->getVersion() - 1));
            $changed = true;
        }
        $changed && $knowledgeBaseDomainService->changeSyncStatus($knowledge);
    }
}
