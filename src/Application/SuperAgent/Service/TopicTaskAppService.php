<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Application\SuperAgent\Service;

use App\ErrorCode\GenericErrorCode;
use App\Infrastructure\Core\Exception\ExceptionBuilder;
use App\Infrastructure\Util\IdGenerator\IdGenerator;
use App\Infrastructure\Util\Locker\LockerInterface;
use Dtyq\SuperMagic\Application\SuperAgent\Event\Publish\TopicTaskMessagePublisher;
use Dtyq\SuperMagic\Interfaces\SuperAgent\Assembler\TopicTaskMessageAssembler;
use Dtyq\SuperMagic\Interfaces\SuperAgent\DTO\Response\DeliverMessageResponseDTO;
use Dtyq\SuperMagic\Interfaces\SuperAgent\DTO\TopicTaskMessageDTO;
use Hyperf\Amqp\Producer;
use Hyperf\Logger\LoggerFactory;
use Psr\Log\LoggerInterface;

class TopicTaskAppService extends AbstractAppService
{
    private readonly LoggerInterface $logger;

    public function __construct(
        protected LockerInterface $locker,
        protected LoggerFactory $loggerFactory,
    ) {
        $this->logger = $this->loggerFactory->get(get_class($this));
    }

    /**
     * 投递话题任务消息.
     *
     * @return array 操作结果
     */
    public function deliverTopicTaskMessage(TopicTaskMessageDTO $messageDTO): array
    {
        // 如果没有有效的 topicId，则无法加锁，直接处理或报错
        $sandboxId = $messageDTO->getMetadata()->getSandboxId();
        if (empty($sandboxId)) {
            $this->logger->warning('Cannot acquire lock without a valid sandboxId in deliverTopicTaskMessage.', ['messageData' => $messageDTO->toArray()]);
            ExceptionBuilder::throw(GenericErrorCode::ParameterMissing, 'message_missing_topic_id_for_locking');
        }

        $lockKey = 'deliver_sandbox_message_lock:' . $sandboxId;
        $lockOwner = IdGenerator::getUniqueId32(); // 使用唯一ID作为锁持有者标识
        $lockExpireSeconds = 10; // 锁的过期时间（秒），防止死锁
        $lockAcquired = false;

        try {
            // 尝试获取分布式互斥锁
            $lockAcquired = $this->locker->mutexLock($lockKey, $lockOwner, $lockExpireSeconds);

            if ($lockAcquired) {
                // --- 临界区开始 ---
                $this->logger->debug(sprintf('Lock acquired for sandbox %s by %s', $sandboxId, $lockOwner));

                // 使用装配器将DTO转换为领域事件
                $topicTaskMessageEvent = TopicTaskMessageAssembler::toEvent($messageDTO);
                // 创建消息发布器
                $topicTaskMessagePublisher = new TopicTaskMessagePublisher($topicTaskMessageEvent);
                // 获取Producer并发送消息
                $producer = di(Producer::class);
                $result = $producer->produce($topicTaskMessagePublisher);

                // 检查发送结果
                if (! $result) {
                    $this->logger->error(sprintf(
                        'deliverTopicTaskMessage failed after acquiring lock, message: %s',
                        json_encode($messageDTO->toArray(), JSON_UNESCAPED_UNICODE)
                    ));
                    // 注意：即使发送失败，也要确保释放锁
                    ExceptionBuilder::throw(GenericErrorCode::SystemError, 'message_delivery_failed');
                }
                // --- 临界区结束 ---
                $this->logger->debug(sprintf('Message produced for sandbox %s by %s', $sandboxId, $lockOwner));
            } else {
                // 获取锁失败（可能已被其他实例持有）
                $this->logger->warning(sprintf('Failed to acquire mutex lock for sandbox %s. It might be held by another instance.', $sandboxId));
                // 根据业务需求决定：抛出错误、稍后重试（例如放入延迟队列）、还是记录日志后认为处理失败
                ExceptionBuilder::throw(GenericErrorCode::SystemError, 'concurrent_message_delivery_failed');
            }
        } finally {
            // 如果获取了锁，确保释放它
            if ($lockAcquired) {
                if ($this->locker->release($lockKey, $lockOwner)) {
                    $this->logger->debug(sprintf('Lock released for sandbox %s by %s', $sandboxId, $lockOwner));
                } else {
                    // 记录释放锁失败的情况，可能需要人工干预
                    $this->logger->error(sprintf('Failed to release lock for sandbox %s held by %s. Manual intervention may be required.', $sandboxId, $lockOwner));
                }
            }
        }

        // 获取消息ID（优先使用负载中的消息ID，如果没有则生成新的）
        $messageId = $messageDTO->getPayload()?->getMessageId() ?: IdGenerator::getSnowId();

        return DeliverMessageResponseDTO::fromResult(true, $messageId)->toArray();
    }
}
