<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Application\SuperAgent\Event\Subscribe;

use App\Infrastructure\Core\Exception\BusinessException;
use Dtyq\SuperMagic\Application\SuperAgent\Service\TaskAppService;
use Dtyq\SuperMagic\Interfaces\SuperAgent\DTO\TopicTaskMessageDTO;
use Hyperf\Amqp\Annotation\Consumer;
use Hyperf\Amqp\Message\ConsumerMessage;
use Hyperf\Amqp\Result;
use Hyperf\Contract\StdoutLoggerInterface;
use PhpAmqpLib\Message\AMQPMessage;
use Throwable;

/**
 * 话题任务消息订阅者.
 */
#[Consumer(exchange: 'super_magic_topic_task_message', routingKey: 'super_magic_topic_task_message', queue: 'super_magic_topic_task_message', nums: 1)]
class TopicTaskMessageSubscriber extends ConsumerMessage
{
    /**
     * 构造函数.
     */
    public function __construct(
        private readonly TaskAppService $superAgentAppService,
        private readonly StdoutLoggerInterface $logger
    ) {
    }

    /**
     * 消费消息.
     *
     * @param mixed $data 消息数据
     * @param AMQPMessage $message 原始消息对象
     * @return Result 处理结果
     */
    public function consumeMessage($data, AMQPMessage $message): Result
    {
        try {
            // 记录接收到的消息内容
            $this->logger->info(sprintf(
                '接收到话题任务消息: %s',
                json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
            ));

            // 验证消息格式
            $this->validateMessageFormat($data);

            // 打印消息详情，用于测试和验证
            $this->logMessageDetails($data);

            // 创建DTO
            $messageDTO = TopicTaskMessageDTO::fromArray($data);

            // 调用应用层服务处理消息
            $this->superAgentAppService->handleTopicTaskMessage($messageDTO);

            // 返回ACK确认消息已处理
            return Result::ACK;
        } catch (BusinessException $e) {
            // 业务异常，记录错误信息
            $this->logger->error(sprintf(
                '处理话题任务消息失败，业务异常: %s, 消息内容: %s',
                $e->getMessage(),
                json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
            ));

            return Result::ACK; // 即使出错也确认消息，避免消息堆积
        } catch (Throwable $e) {
            // 其他异常，记录错误信息
            $this->logger->error(sprintf(
                '处理话题任务消息失败，系统异常: %s, 消息内容: %s',
                $e->getMessage(),
                json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
            ));

            return Result::ACK; // 即使出错也确认消息，避免消息堆积
        }
    }

    /**
     * 验证消息格式.
     *
     * @param mixed $data 消息数据
     * @throws BusinessException 如果消息格式不正确则抛出异常
     */
    private function validateMessageFormat($data): void
    {
        // 检查是否为新格式消息
        if (isset($data['metadata'], $data['payload'])) {
            // 新格式消息，检查payload中的必要字段
            $payload = $data['payload'];
            $requiredFields = [
                'message_id',
                'type',
                'task_id',
            ];

            foreach ($requiredFields as $field) {
                if (! isset($payload[$field]) || empty($payload[$field])) {
                    $this->logger->warning(sprintf(
                        '消息格式不正确，payload中缺少必要字段: %s, 消息内容: %s',
                        $field,
                        json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
                    ));
                }
            }

            // 检查metadata中的必要字段
            if (! isset($data['metadata']['sandbox_id']) || empty($data['metadata']['sandbox_id'])) {
                $this->logger->warning(sprintf(
                    '消息格式不正确，metadata中缺少sandbox_id字段, 消息内容: %s',
                    json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
                ));
            }
        } else {
            // 旧格式消息，检查必要字段
            $requiredFields = [
                'message_id',
                'type',
                'task_id',
                'sandbox_id',
            ];

            foreach ($requiredFields as $field) {
                if (! isset($data[$field]) || empty($data[$field])) {
                    $this->logger->warning(sprintf(
                        '消息格式不正确，缺少必要字段: %s, 消息内容: %s',
                        $field,
                        json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
                    ));
                }
            }
        }
    }

    /**
     * 打印消息详情.
     *
     * @param array $data 消息数据
     */
    private function logMessageDetails(array $data): void
    {
        if (isset($data['metadata'], $data['payload'])) {
            // 新格式消息
            $payload = $data['payload'];
            $metadata = $data['metadata'];

            // 记录元数据
            $this->logger->info(sprintf(
                '话题任务消息元数据 - sandbox_id: %s, agent_user_id: %s',
                $metadata['sandbox_id'] ?? '未提供',
                $metadata['agent_user_id'] ?? '未提供'
            ));

            // 记录负载数据
            $this->logger->info(sprintf(
                '话题任务消息负载 - message_id: %s, type: %s, task_id: %s, status: %s',
                $payload['message_id'] ?? '未提供',
                $payload['type'] ?? '未提供',
                $payload['task_id'] ?? '未提供',
                $payload['status'] ?? '未提供'
            ));

            // 记录消息内容
            if (isset($payload['content']) && ! empty($payload['content'])) {
                $this->logger->info(sprintf(
                    '话题任务消息内容: %s',
                    $payload['content']
                ));
            }

            // 记录步骤信息
            if (isset($payload['steps']) && ! empty($payload['steps'])) {
                $this->logger->info(sprintf(
                    '话题任务步骤信息: %s',
                    json_encode($payload['steps'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
                ));
            }

            // 记录工具信息
            if (isset($payload['tool']) && ! empty($payload['tool'])) {
                $this->logger->info(sprintf(
                    '话题任务工具信息: %s',
                    json_encode($payload['tool'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
                ));
            }
        } else {
            // 旧格式消息
            // 记录消息ID和类型
            $this->logger->info(sprintf(
                '话题任务消息详情(旧格式) - message_id: %s, type: %s, task_id: %s, status: %s',
                $data['message_id'] ?? '未提供',
                $data['type'] ?? '未提供',
                $data['task_id'] ?? '未提供',
                $data['status'] ?? '未提供'
            ));

            // 记录消息内容
            if (isset($data['content']) && ! empty($data['content'])) {
                $this->logger->info(sprintf(
                    '话题任务消息内容: %s',
                    $data['content']
                ));
            }

            // 记录步骤信息
            if (isset($data['steps']) && ! empty($data['steps'])) {
                $this->logger->info(sprintf(
                    '话题任务步骤信息: %s',
                    json_encode($data['steps'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
                ));
            }

            // 记录工具信息
            if (isset($data['tool']) && ! empty($data['tool'])) {
                $this->logger->info(sprintf(
                    '话题任务工具信息: %s',
                    json_encode($data['tool'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
                ));
            }
        }
    }
}
