<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Application\SuperAgent\Event\Subscribe;

use Dtyq\AsyncEvent\Kernel\Annotation\AsyncListener;
use Dtyq\SuperMagic\Domain\SuperAgent\Event\ProjectDeletedEvent;
use Dtyq\SuperMagic\Domain\SuperAgent\Event\ProjectsBatchDeletedEvent;
use Dtyq\SuperMagic\Domain\SuperAgent\Event\TopicDeletedEvent;
use Dtyq\SuperMagic\Domain\SuperAgent\Service\MessageQueueDomainService;
use Hyperf\Event\Annotation\Listener;
use Hyperf\Event\Contract\ListenerInterface;
use Hyperf\Logger\LoggerFactory;
use Psr\Log\LoggerInterface;
use Throwable;

#[AsyncListener]
#[Listener]
class MessageQueueCascadeDeleteSubscriber implements ListenerInterface
{
    private LoggerInterface $logger;

    public function __construct(
        private readonly MessageQueueDomainService $messageQueueDomainService,
        LoggerFactory $loggerFactory
    ) {
        $this->logger = $loggerFactory->get(static::class);
    }

    public function listen(): array
    {
        return [
            TopicDeletedEvent::class,
            ProjectDeletedEvent::class,
            ProjectsBatchDeletedEvent::class,
        ];
    }

    public function process(object $event): void
    {
        $eventClass = get_class($event);

        try {
            if ($event instanceof TopicDeletedEvent) {
                $topicIds = [(int) $event->getTopicEntity()->getId()];
                $reason = 'Topic deleted, message queue cascade cleanup';
                $affectedRows = $this->messageQueueDomainService->cascadeDeleteUnfinishedByTopicIds($topicIds, $reason);
                $this->logCompleted($eventClass, $topicIds, [], $affectedRows, $reason);
                return;
            }

            if ($event instanceof ProjectDeletedEvent) {
                $projectIds = [(int) $event->getProjectEntity()->getId()];
                $reason = 'Project deleted, message queue cascade cleanup';
                $affectedRows = $this->messageQueueDomainService->cascadeDeleteUnfinishedByProjectIds($projectIds, $reason);
                $this->logCompleted($eventClass, [], $projectIds, $affectedRows, $reason);
                return;
            }

            if ($event instanceof ProjectsBatchDeletedEvent) {
                $projectIds = array_map('intval', $event->getProjectIds());
                $reason = 'Projects batch deleted, message queue cascade cleanup';
                $affectedRows = $this->messageQueueDomainService->cascadeDeleteUnfinishedByProjectIds($projectIds, $reason);
                $this->logCompleted($eventClass, [], $projectIds, $affectedRows, $reason);
            }
        } catch (Throwable $e) {
            $this->logger->error('Message queue cascade cleanup failed', [
                'event_class' => $eventClass,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }

    /**
     * @param int[] $topicIds
     * @param int[] $projectIds
     */
    private function logCompleted(
        string $eventClass,
        array $topicIds,
        array $projectIds,
        int $affectedRows,
        string $reason
    ): void {
        $this->logger->info('Message queue cascade cleanup completed', [
            'event_class' => $eventClass,
            'topic_ids' => $topicIds,
            'project_ids' => $projectIds,
            'affected_rows' => $affectedRows,
            'reason' => $reason,
        ]);
    }
}
