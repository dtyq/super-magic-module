<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Application\SuperAgent\Event\Subscribe;

use App\Domain\Contact\Entity\ValueObject\DataIsolation;
use Dtyq\SuperMagic\Application\SuperAgent\Service\TaskAppService;
use Dtyq\SuperMagic\Domain\SuperAgent\Entity\ValueObject\ChatInstruction;
use Dtyq\SuperMagic\Domain\SuperAgent\Entity\ValueObject\TaskMode;
use Hyperf\Amqp\Annotation\Consumer;
use Hyperf\Amqp\Message\ConsumerMessage;
use Hyperf\Amqp\Result;
use Hyperf\Contract\StdoutLoggerInterface;
use PhpAmqpLib\Message\AMQPMessage;
use Throwable;

#[Consumer(exchange: 'dispatch_general_agent_message', routingKey: 'dispatch_general_agent_message', queue: 'dispatch_general_agent_message', nums: 1)]
class SuperAgentMessageSubscriber extends ConsumerMessage
{
    public function __construct(
        private readonly TaskAppService $SuperAgentAppService,
        private readonly StdoutLoggerInterface $logger
    ) {
    }

    public function consumeMessage($event, AMQPMessage $message): Result
    {
        try {
            $this->logger->debug(sprintf(
                '接收到通用智能体消息，事件: %s',
                json_encode($event, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
            ));

            // 提取必要信息
            $conversationId = $event['seq_entity']['conversation_id'] ?? '';
            $chatTopicId = $event['seq_entity']['extra']['topic_id'] ?? '';
            $organizationCode = $event['sender_user_entity']['organization_code'] ?? '';
            $userId = $event['sender_user_entity']['user_id'] ?? '';
            $agentUserId = $event['agent_user_entity']['user_id'] ?? '';
            $prompt = $event['message_entity']['message_content']['content'] ?? '';
            $attachments = $event['message_entity']['message_content']['attachments'] ?? [];
            $instructions = $event['message_entity']['message_content']['instructs'] ?? [];

            // 参数验证
            if (empty($conversationId) || empty($chatTopicId) || empty($organizationCode)
                || empty($userId) || empty($agentUserId)) {
                $this->logger->error(sprintf(
                    '消息参数不完整, conversation_id: %s, topic_id: %s, organization_code: %s, user_id: %s, agent_user_id: %s',
                    $conversationId,
                    $chatTopicId,
                    $organizationCode,
                    $userId,
                    $agentUserId
                ));
                return Result::ACK;
            }

            // 创建数据隔离对象
            $dataIsolation = DataIsolation::create($organizationCode, $userId);

            // 将附件数组转为JSON
            $attachmentsJson = ! empty($attachments) ? json_encode($attachments, JSON_UNESCAPED_UNICODE) : '';

            // 解析指令信息
            [$chatInstructs, $taskMode] = $this->parseInstructions($instructions);

            // 初始化Agent任务
            $taskId = $this->SuperAgentAppService->initAgentTask(
                dataIsolation: $dataIsolation,
                agentUserId: $agentUserId,
                conversationId: $conversationId,
                chatTopicId: $chatTopicId,
                prompt: $prompt,
                attachments: $attachmentsJson,
                instruction: $chatInstructs,
                taskMode: $taskMode
            );

            $this->logger->info(sprintf('通用智能体任务已初始化，任务ID: %s', $taskId));

            return Result::ACK;
        } catch (Throwable $e) {
            $this->logger->error(sprintf(
                '处理通用智能体消息失败: %s, event: %s',
                $e->getMessage(),
                json_encode($event, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
            ));

            return Result::ACK; // 即使出错也确认消息，避免消息堆积
        }
    }

    /**
     * 解析指令，提取聊天指令和任务模式.
     *
     * @param array $instructions 指令数组
     * @return array 返回 [ChatInstruction, string taskMode]
     */
    private function parseInstructions(array $instructions): array
    {
        // 默认值
        $chatInstructs = ChatInstruction::Normal;
        $taskMode = '';

        if (empty($instructions)) {
            return [$chatInstructs, $taskMode];
        }

        // 检查是否有匹配的聊天指令或任务模式
        foreach ($instructions as $instruction) {
            $value = $instruction['value'] ?? '';

            // 先尝试匹配聊天指令
            $tempChatInstruct = ChatInstruction::tryFrom($value);
            if ($tempChatInstruct !== null) {
                $chatInstructs = $tempChatInstruct;
                continue; // 找到聊天指令后继续找任务模式
            }

            // 尝试匹配任务模式
            $tempTaskMode = TaskMode::tryFrom($value);
            if ($tempTaskMode !== null) {
                $taskMode = $tempTaskMode->value;
                break; // 找到任务模式后可以结束循环
            }
        }
        return [$chatInstructs, $taskMode];
    }
}
