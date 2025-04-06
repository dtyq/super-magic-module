<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\KnowledgeBase\Event\Subscribe;

use App\Domain\KnowledgeBase\Entity\ValueObject\KnowledgeSyncStatus;
use App\Domain\KnowledgeBase\Event\KnowledgeBaseRemovedEvent;
use App\Domain\KnowledgeBase\Service\KnowledgeBaseDomainService;
use Hyperf\Event\Annotation\Listener;
use Hyperf\Event\Contract\ListenerInterface;
use Psr\Container\ContainerInterface;
use Throwable;

#[Listener]
readonly class KnowledgeBaseDestroySubscriber implements ListenerInterface
{
    public function __construct(private ContainerInterface $container)
    {
    }

    public function listen(): array
    {
        return [
            KnowledgeBaseRemovedEvent::class,
        ];
    }

    public function process(object $event): void
    {
        if (! $event instanceof KnowledgeBaseRemovedEvent) {
            return;
        }
        $knowledge = $event->magicFlowKnowledgeEntity;
        $magicFlowKnowledgeDomainService = $this->container->get(KnowledgeBaseDomainService::class);

        try {
            $vector = $knowledge->getVectorDBDriver();
            $vector->removeCollection($knowledge->getCollectionName());
            $knowledge->setSyncStatus(KnowledgeSyncStatus::Deleted);
        } catch (Throwable $throwable) {
            $knowledge->setSyncStatus(KnowledgeSyncStatus::DeleteFailed);
            $knowledge->setSyncStatusMessage($throwable->getMessage());
        }
        $magicFlowKnowledgeDomainService->changeSyncStatus($knowledge);
    }
}
