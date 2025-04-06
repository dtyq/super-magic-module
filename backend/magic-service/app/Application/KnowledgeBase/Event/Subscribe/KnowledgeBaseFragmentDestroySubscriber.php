<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\KnowledgeBase\Event\Subscribe;

use App\Domain\Flow\Entity\ValueObject\FlowDataIsolation;
use App\Domain\KnowledgeBase\Entity\ValueObject\KnowledgeSyncStatus;
use App\Domain\KnowledgeBase\Event\KnowledgeBaseFragmentRemovedEvent;
use App\Domain\KnowledgeBase\Service\KnowledgeBaseDomainService;
use Hyperf\Event\Annotation\Listener;
use Hyperf\Event\Contract\ListenerInterface;
use Psr\Container\ContainerInterface;
use Throwable;

#[Listener]
readonly class KnowledgeBaseFragmentDestroySubscriber implements ListenerInterface
{
    public function __construct(private ContainerInterface $container)
    {
    }

    public function listen(): array
    {
        return [
            KnowledgeBaseFragmentRemovedEvent::class,
        ];
    }

    public function process(object $event): void
    {
        if (! $event instanceof KnowledgeBaseFragmentRemovedEvent) {
            return;
        }

        $knowledge = $event->magicFlowKnowledgeEntity;
        $fragment = $event->magicFlowKnowledgeFragmentEntity;
        $magicFlowKnowledgeDomainService = $this->container->get(KnowledgeBaseDomainService::class);
        $dataIsolation = FlowDataIsolation::create($knowledge->getOrganizationCode());

        try {
            $knowledge->getVectorDBDriver()->removePoint($knowledge->getCollectionName(), $fragment->getPointId());
            $magicFlowKnowledgeDomainService->fragmentBatchDestroyByPointIds($dataIsolation, $knowledge, [$fragment->getPointId()]);

            $fragment->setSyncStatus(KnowledgeSyncStatus::Deleted);
        } catch (Throwable $throwable) {
            $fragment->setSyncStatus(KnowledgeSyncStatus::DeleteFailed);
            $fragment->setSyncStatusMessage($throwable->getMessage());
        }
        $magicFlowKnowledgeDomainService->changeSyncStatus($fragment);
    }
}
