<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\KnowledgeBase\Event\Subscribe;

use App\Application\ModelGateway\Mapper\ModelGatewayMapper;
use App\Domain\KnowledgeBase\Entity\ValueObject\KnowledgeSyncStatus;
use App\Domain\KnowledgeBase\Event\KnowledgeBaseFragmentSavedEvent;
use App\Domain\KnowledgeBase\Service\KnowledgeBaseDomainService;
use App\Infrastructure\Core\Embeddings\EmbeddingGenerator\EmbeddingGeneratorInterface;
use Dtyq\AsyncEvent\Kernel\Annotation\AsyncListener;
use Hyperf\Codec\Json;
use Hyperf\Event\Annotation\Listener;
use Hyperf\Event\Contract\ListenerInterface;
use Psr\Container\ContainerInterface;
use Throwable;

#[AsyncListener]
#[Listener]
readonly class KnowledgeBaseFragmentSyncSubscriber implements ListenerInterface
{
    public function __construct(private ContainerInterface $container)
    {
    }

    public function listen(): array
    {
        return [
            KnowledgeBaseFragmentSavedEvent::class,
        ];
    }

    public function process(object $event): void
    {
        if (! $event instanceof KnowledgeBaseFragmentSavedEvent) {
            return;
        }
        $knowledge = $event->magicFlowKnowledgeEntity;
        $fragment = $event->magicFlowKnowledgeFragmentEntity;
        $magicFlowKnowledgeDomainService = $this->container->get(KnowledgeBaseDomainService::class);

        // todo 做成队列限流

        try {
            $vector = $knowledge->getVectorDBDriver();

            // 如果具有向量的，则不重新嵌入
            if (empty($fragment->getVector())) {
                $fragment->setSyncStatus(KnowledgeSyncStatus::Syncing);
                $magicFlowKnowledgeDomainService->changeSyncStatus($fragment);

                $model = di(ModelGatewayMapper::class)->getEmbeddingModelProxy($knowledge->getModel(), $knowledge->getOrganizationCode());
                $embeddingGenerator = $this->container->get(EmbeddingGeneratorInterface::class);
                $embeddings = $embeddingGenerator->embedText($model, $fragment->getContent(), options: [
                    'business_params' => [
                        'organization_id' => $knowledge->getOrganizationCode(),
                        'user_id' => $fragment->getModifier(),
                        'business_id' => $knowledge->getCode(),
                        'source_id' => 'fragment_saved',
                    ],
                ]);
                $fragment->setVector(Json::encode($embeddings));
            } else {
                $embeddings = Json::decode($fragment->getVector());
            }

            $vector->storePoint($knowledge->getCollectionName(), $fragment->getPointId(), $embeddings, $fragment->getPayload());

            $fragment->setSyncStatus(KnowledgeSyncStatus::Synced);
        } catch (Throwable $throwable) {
            $fragment->setSyncStatus(KnowledgeSyncStatus::SyncFailed);
            $fragment->setSyncStatusMessage($throwable->getMessage());
        }
        $magicFlowKnowledgeDomainService->changeSyncStatus($fragment);
    }
}
