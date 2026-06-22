<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Tests\Unit\Application\SuperAgent\Service;

use Dtyq\SuperMagic\Application\SuperAgent\Event\Subscribe\MessageQueueCascadeDeleteSubscriber;
use Dtyq\SuperMagic\Domain\SuperAgent\Entity\ProjectEntity;
use Dtyq\SuperMagic\Domain\SuperAgent\Entity\TopicEntity;
use Dtyq\SuperMagic\Domain\SuperAgent\Event\ProjectDeletedEvent;
use Dtyq\SuperMagic\Domain\SuperAgent\Event\ProjectsBatchDeletedEvent;
use Dtyq\SuperMagic\Domain\SuperAgent\Event\TopicDeletedEvent;
use Dtyq\SuperMagic\Domain\SuperAgent\Service\MessageQueueDomainService;
use Hyperf\Logger\LoggerFactory;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;
use RuntimeException;

/**
 * @internal
 */
class MessageQueueCascadeDeleteSubscriberTest extends TestCase
{
    private MessageQueueDomainService|MockObject $messageQueueDomainService;

    private LoggerInterface|MockObject $logger;

    private MessageQueueCascadeDeleteSubscriber $subscriber;

    protected function setUp(): void
    {
        parent::setUp();

        $this->messageQueueDomainService = $this->createMock(MessageQueueDomainService::class);
        $this->logger = $this->createMock(LoggerInterface::class);
        $loggerFactory = $this->createMock(LoggerFactory::class);
        $loggerFactory->method('get')->willReturn($this->logger);

        $this->subscriber = new MessageQueueCascadeDeleteSubscriber(
            $this->messageQueueDomainService,
            $loggerFactory
        );
    }

    public function testListenReturnsDeletionEvents(): void
    {
        $this->assertSame(
            [
                TopicDeletedEvent::class,
                ProjectDeletedEvent::class,
                ProjectsBatchDeletedEvent::class,
            ],
            $this->subscriber->listen()
        );
    }

    public function testTopicDeletedEventCleansUnfinishedQueuesByTopic(): void
    {
        $topicEntity = $this->createMock(TopicEntity::class);
        $topicEntity->method('getId')->willReturn(123);

        $event = $this->createMock(TopicDeletedEvent::class);
        $event->method('getTopicEntity')->willReturn($topicEntity);

        $this->messageQueueDomainService->expects($this->once())
            ->method('cascadeDeleteUnfinishedByTopicIds')
            ->with([123], 'Topic deleted, message queue cascade cleanup')
            ->willReturn(3);

        $this->logger->expects($this->once())
            ->method('info')
            ->with(
                'Message queue cascade cleanup completed',
                $this->callback(fn (array $context): bool => is_a($context['event_class'], TopicDeletedEvent::class, true)
                    && $context['topic_ids'] === [123]
                    && $context['affected_rows'] === 3)
            );

        $this->subscriber->process($event);
    }

    public function testProjectDeletedEventCleansUnfinishedQueuesByProject(): void
    {
        $projectEntity = $this->createMock(ProjectEntity::class);
        $projectEntity->method('getId')->willReturn(456);

        $event = $this->createMock(ProjectDeletedEvent::class);
        $event->method('getProjectEntity')->willReturn($projectEntity);

        $this->messageQueueDomainService->expects($this->once())
            ->method('cascadeDeleteUnfinishedByProjectIds')
            ->with([456], 'Project deleted, message queue cascade cleanup')
            ->willReturn(5);

        $this->logger->expects($this->once())
            ->method('info')
            ->with(
                'Message queue cascade cleanup completed',
                $this->callback(fn (array $context): bool => is_a($context['event_class'], ProjectDeletedEvent::class, true)
                    && $context['project_ids'] === [456]
                    && $context['affected_rows'] === 5)
            );

        $this->subscriber->process($event);
    }

    public function testProjectsBatchDeletedEventCleansUnfinishedQueuesByProjects(): void
    {
        $event = $this->createMock(ProjectsBatchDeletedEvent::class);
        $event->method('getProjectIds')->willReturn([456, 789]);

        $this->messageQueueDomainService->expects($this->once())
            ->method('cascadeDeleteUnfinishedByProjectIds')
            ->with([456, 789], 'Projects batch deleted, message queue cascade cleanup')
            ->willReturn(8);

        $this->logger->expects($this->once())
            ->method('info')
            ->with(
                'Message queue cascade cleanup completed',
                $this->callback(fn (array $context): bool => is_a($context['event_class'], ProjectsBatchDeletedEvent::class, true)
                    && $context['project_ids'] === [456, 789]
                    && $context['affected_rows'] === 8)
            );

        $this->subscriber->process($event);
    }

    public function testCleanupExceptionIsLoggedAndSwallowed(): void
    {
        $topicEntity = $this->createMock(TopicEntity::class);
        $topicEntity->method('getId')->willReturn(123);

        $event = $this->createMock(TopicDeletedEvent::class);
        $event->method('getTopicEntity')->willReturn($topicEntity);

        $this->messageQueueDomainService->expects($this->once())
            ->method('cascadeDeleteUnfinishedByTopicIds')
            ->willThrowException(new RuntimeException('cleanup failed'));

        $this->logger->expects($this->once())
            ->method('error')
            ->with(
                'Message queue cascade cleanup failed',
                $this->callback(fn (array $context): bool => is_a($context['event_class'], TopicDeletedEvent::class, true)
                    && $context['error'] === 'cleanup failed'
                    && isset($context['trace']))
            );

        $this->subscriber->process($event);

        $this->addToAssertionCount(1);
    }
}
