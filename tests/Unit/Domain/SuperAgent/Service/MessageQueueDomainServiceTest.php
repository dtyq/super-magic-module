<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Tests\Unit\Domain\SuperAgent\Service;

use App\Domain\Contact\Entity\ValueObject\DataIsolation;
use App\Infrastructure\Util\Locker\LockerInterface;
use Dtyq\SuperMagic\Domain\SuperAgent\Entity\MessageQueueEntity;
use Dtyq\SuperMagic\Domain\SuperAgent\Entity\ValueObject\MessageQueueStatus;
use Dtyq\SuperMagic\Domain\SuperAgent\Repository\Facade\MessageQueueRepositoryInterface;
use Dtyq\SuperMagic\Domain\SuperAgent\Service\MessageQueueDomainService;
use Hyperf\Logger\LoggerFactory;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;

/**
 * MessageQueueDomainService Compensation Methods Unit Test.
 * 消息队列领域服务补偿方法单元测试.
 * @internal
 */
class MessageQueueDomainServiceTest extends TestCase
{
    private MessageQueueDomainService $service;

    private MessageQueueRepositoryInterface|MockObject $mockRepository;

    private LockerInterface|MockObject $mockLocker;

    private LoggerFactory|MockObject $mockLoggerFactory;

    protected function setUp(): void
    {
        parent::setUp();

        $this->mockRepository = $this->createMock(MessageQueueRepositoryInterface::class);
        $this->mockLocker = $this->createMock(LockerInterface::class);
        $this->mockLoggerFactory = $this->createMock(LoggerFactory::class);
        $this->mockLoggerFactory->method('get')->willReturn($this->createMock(LoggerInterface::class));

        $this->service = new MessageQueueDomainService(
            $this->mockRepository,
            $this->mockLocker,
            $this->mockLoggerFactory
        );
    }

    /**
     * Test getCompensationTopics method.
     * 测试获取补偿话题ID列表方法.
     *
     * 📊 Test Cases:
     * ┌─────────────────────┬──────────────────┬─────────────────┬─────────────────┐
     * │      Scenario       │   Organization   │     Limit       │    Expected     │
     * │                     │     Codes        │                 │     Result      │
     * ├─────────────────────┼──────────────────┼─────────────────┼─────────────────┤
     * │ All organizations   │     []           │       50        │  [1, 2, 3]      │
     * │ Specific orgs       │ ['org1', 'org2'] │       10        │  [1, 2]         │
     * │ No pending topics   │     []           │       50        │  []             │
     * └─────────────────────┴──────────────────┴─────────────────┴─────────────────┘
     */
    public function testGetCompensationTopics(): void
    {
        // Test Case 1: All organizations
        $this->mockRepository->expects($this->once())
            ->method('getCompensationTopics')
            ->with(50, [])
            ->willReturn([1, 2, 3]);

        $result = $this->service->getCompensationTopics(50, []);
        $this->assertEquals([1, 2, 3], $result);
    }

    public function testGetCompensationTopicsWithSpecificOrganizations(): void
    {
        // Test Case 2: Specific organizations
        $this->mockRepository->expects($this->once())
            ->method('getCompensationTopics')
            ->with(10, ['org1', 'org2'])
            ->willReturn([1, 2]);

        $result = $this->service->getCompensationTopics(10, ['org1', 'org2']);
        $this->assertEquals([1, 2], $result);
    }

    public function testGetCompensationTopicsWithNoPendingTopics(): void
    {
        // Test Case 3: No pending topics
        $this->mockRepository->expects($this->once())
            ->method('getCompensationTopics')
            ->with(50, [])
            ->willReturn([]);

        $result = $this->service->getCompensationTopics();
        $this->assertEquals([], $result);
    }

    /**
     * Test getEarliestMessageByTopic method.
     * 测试获取话题最早消息方法.
     *
     * 📊 Test Cases:
     * ┌─────────────────────┬─────────────────┬─────────────────────────────────────┐
     * │      Scenario       │    Topic ID     │            Expected Result          │
     * ├─────────────────────┼─────────────────┼─────────────────────────────────────┤
     * │ Message exists      │       123       │ MessageQueueEntity object           │
     * │ No message found    │       456       │ null                               │
     * │ Empty topic         │       789       │ null                               │
     * └─────────────────────┴─────────────────┴─────────────────────────────────────┘
     */
    public function testGetEarliestMessageByTopic(): void
    {
        // Test Case 1: Message exists
        $mockMessage = $this->createMockMessageEntity(1, 123, 'user1');

        $this->mockRepository->expects($this->once())
            ->method('getEarliestMessageByTopic')
            ->with(123)
            ->willReturn($mockMessage);

        $result = $this->service->getEarliestMessageByTopic(123);
        $this->assertInstanceOf(MessageQueueEntity::class, $result);
        $this->assertEquals(123, $result->getTopicId());
    }

    public function testGetEarliestMessageByTopicReturnsNull(): void
    {
        // Test Case 2: No message found
        $this->mockRepository->expects($this->once())
            ->method('getEarliestMessageByTopic')
            ->with(456)
            ->willReturn(null);

        $result = $this->service->getEarliestMessageByTopic(456);
        $this->assertNull($result);
    }

    public function testGetEarliestMessageByTopicEmptyTopic(): void
    {
        // Test Case 3: Empty topic
        $this->mockRepository->expects($this->once())
            ->method('getEarliestMessageByTopic')
            ->with(789)
            ->willReturn(null);

        $result = $this->service->getEarliestMessageByTopic(789);
        $this->assertNull($result);
    }

    /**
     * Test delayTopicMessages method.
     * 测试延迟话题消息方法.
     *
     * 📊 Test Cases:
     * ┌─────────────────────┬─────────────────┬─────────────────┬─────────────────┐
     * │      Scenario       │    Topic ID     │ Delay Minutes   │    Expected     │
     * ├─────────────────────┼─────────────────┼─────────────────┼─────────────────┤
     * │ Successful delay    │       123       │        5        │      true       │
     * │ No messages found   │       456       │       10        │      false      │
     * │ Large delay time    │       789       │       60        │      true       │
     * └─────────────────────┴─────────────────┴─────────────────┴─────────────────┘
     */
    public function testDelayTopicMessagesSuccessful(): void
    {
        // Test Case 1: Successful delay
        $this->mockRepository->expects($this->once())
            ->method('delayTopicMessages')
            ->with(123, 5)
            ->willReturn(true);

        $result = $this->service->delayTopicMessages(123, 5);
        $this->assertTrue($result);
    }

    public function testDelayTopicMessagesNoMessages(): void
    {
        // Test Case 2: No messages found
        $this->mockRepository->expects($this->once())
            ->method('delayTopicMessages')
            ->with(456, 10)
            ->willReturn(false);

        $result = $this->service->delayTopicMessages(456, 10);
        $this->assertFalse($result);
    }

    public function testDelayTopicMessagesLargeDelay(): void
    {
        // Test Case 3: Large delay time
        $this->mockRepository->expects($this->once())
            ->method('delayTopicMessages')
            ->with(789, 60)
            ->willReturn(true);

        $result = $this->service->delayTopicMessages(789, 60);
        $this->assertTrue($result);
    }

    /**
     * Test updateStatus method.
     * 测试更新消息状态方法.
     *
     * 📊 Test Cases:
     * ┌─────────────────────┬────────────────┬──────────────────┬────────────────┬─────────────────┐
     * │      Scenario       │   Message ID   │      Status      │ Error Message  │    Expected     │
     * ├─────────────────────┼────────────────┼──────────────────┼────────────────┼─────────────────┤
     * │ Update to completed │      1001      │    COMPLETED     │      null      │      true       │
     * │ Update to failed    │      1002      │     FAILED       │  "Error text"  │      true       │
     * │ Long error message  │      1003      │     FAILED       │  500+ chars    │      true       │
     * │ Update not found    │      9999      │    COMPLETED     │      null      │      false      │
     * └─────────────────────┴────────────────┴──────────────────┴────────────────┴─────────────────┘
     */
    public function testUpdateStatusToCompleted(): void
    {
        // Test Case 1: Update to completed
        $this->mockRepository->expects($this->once())
            ->method('updateStatus')
            ->with(1001, MessageQueueStatus::COMPLETED, null)
            ->willReturn(true);

        $result = $this->service->updateStatus(1001, MessageQueueStatus::COMPLETED);
        $this->assertTrue($result);
    }

    public function testUpdateStatusToFailedWithError(): void
    {
        // Test Case 2: Update to failed with error message
        $this->mockRepository->expects($this->once())
            ->method('updateStatus')
            ->with(1002, MessageQueueStatus::FAILED, 'Error text')
            ->willReturn(true);

        $result = $this->service->updateStatus(1002, MessageQueueStatus::FAILED, 'Error text');
        $this->assertTrue($result);
    }

    public function testUpdateStatusWithLongErrorMessage(): void
    {
        // Test Case 3: Long error message (should be truncated)
        $longErrorMessage = str_repeat('Error ', 100); // 600+ characters
        $expectedTruncated = mb_substr($longErrorMessage, 0, 497) . '...';

        $this->mockRepository->expects($this->once())
            ->method('updateStatus')
            ->with(1003, MessageQueueStatus::FAILED, $expectedTruncated)
            ->willReturn(true);

        $result = $this->service->updateStatus(1003, MessageQueueStatus::FAILED, $longErrorMessage);
        $this->assertTrue($result);
    }

    public function testUpdateStatusNotFound(): void
    {
        // Test Case 4: Update not found
        $this->mockRepository->expects($this->once())
            ->method('updateStatus')
            ->with(9999, MessageQueueStatus::COMPLETED, null)
            ->willReturn(false);

        $result = $this->service->updateStatus(9999, MessageQueueStatus::COMPLETED);
        $this->assertFalse($result);
    }

    /**
     * Test updateStatus with various error message lengths.
     * 测试不同长度错误消息的处理.
     *
     * 🧪 Error Message Length Test:
     * ┌─────────────────────┬─────────────────┬─────────────────────────────────────┐
     * │    Message Length   │   Should Trim   │          Expected Behavior          │
     * ├─────────────────────┼─────────────────┼─────────────────────────────────────┤
     * │ Short (< 500)       │       No        │ Keep original message               │
     * │ Exactly 500         │       No        │ Keep original message               │
     * │ Long (> 500)        │      Yes        │ Trim to 497 chars + '...'           │
     * └─────────────────────┴─────────────────┴─────────────────────────────────────┘
     */
    public function testUpdateStatusErrorMessageTrimmingShort(): void
    {
        // Short message (< 500 chars)
        $shortMessage = 'Short error message';
        $this->mockRepository->expects($this->once())
            ->method('updateStatus')
            ->with(1, MessageQueueStatus::FAILED, $shortMessage)
            ->willReturn(true);

        $this->service->updateStatus(1, MessageQueueStatus::FAILED, $shortMessage);
    }

    public function testUpdateStatusErrorMessageTrimmingExact(): void
    {
        // Exactly 500 chars
        $exactMessage = str_repeat('A', 500);
        $this->mockRepository->expects($this->once())
            ->method('updateStatus')
            ->with(2, MessageQueueStatus::FAILED, $exactMessage)
            ->willReturn(true);

        $this->service->updateStatus(2, MessageQueueStatus::FAILED, $exactMessage);
    }

    public function testUpdateStatusErrorMessageTrimmingLong(): void
    {
        // Long message (> 500 chars)
        $longMessage = str_repeat('B', 600);
        $expectedTrimmed = str_repeat('B', 497) . '...';
        $this->mockRepository->expects($this->once())
            ->method('updateStatus')
            ->with(3, MessageQueueStatus::FAILED, $expectedTrimmed)
            ->willReturn(true);

        $this->service->updateStatus(3, MessageQueueStatus::FAILED, $longMessage);
    }

    public function testQueryMessagesExcludesDeletedTopics(): void
    {
        $dataIsolation = DataIsolation::simpleMake('org1', 'user1');

        $this->mockRepository->expects($this->once())
            ->method('getMessagesByStatuses')
            ->with(
                [
                    'topic_id' => 123,
                    'user_id' => 'user1',
                    'status' => [
                        MessageQueueStatus::PENDING->value,
                        MessageQueueStatus::IN_PROGRESS->value,
                        MessageQueueStatus::FAILED->value,
                    ],
                ],
                [],
                true,
                20,
                2,
                'id',
                'asc',
                true
            )
            ->willReturn(['list' => [], 'total' => 0]);

        $result = $this->service->queryMessages($dataIsolation, ['topic_id' => 123], 2, 20);

        $this->assertSame(['list' => [], 'total' => 0], $result);
    }

    public function testCascadeDeleteUnfinishedByTopicIdsNormalizesIdsAndTruncatesReason(): void
    {
        $longReason = str_repeat('A', 600);
        $expectedReason = str_repeat('A', 497) . '...';

        $this->mockRepository->expects($this->once())
            ->method('cascadeDeleteUnfinishedByTopicIds')
            ->with([123, 456], $expectedReason)
            ->willReturn(2);

        $result = $this->service->cascadeDeleteUnfinishedByTopicIds(['123', 0, 456, 123], $longReason);

        $this->assertSame(2, $result);
    }

    public function testCascadeDeleteUnfinishedByProjectIdsIgnoresEmptyIds(): void
    {
        $this->mockRepository->expects($this->never())
            ->method('cascadeDeleteUnfinishedByProjectIds');

        $result = $this->service->cascadeDeleteUnfinishedByProjectIds([], 'Project deleted');

        $this->assertSame(0, $result);
    }

    /**
     * Create mock MessageQueueEntity for testing.
     * 创建测试用的消息队列实体.
     */
    private function createMockMessageEntity(int $id, int $topicId, string $userId): MessageQueueEntity
    {
        $entity = new MessageQueueEntity();
        $entity->setId($id)
            ->setTopicId($topicId)
            ->setUserId($userId)
            ->setOrganizationCode('test_org')
            ->setProjectId(1)
            ->setMessageContent('{"content": "test"}')
            ->setMessageType('text')
            ->setStatus(MessageQueueStatus::PENDING)
            ->setExceptExecuteTime('2024-01-01 12:00:00')
            ->setCreatedAt('2024-01-01 10:00:00')
            ->setUpdatedAt('2024-01-01 10:00:00');

        return $entity;
    }
}
