<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Application\SuperAgent\Event\Subscribe;

use App\Application\Chat\Service\MagicAgentEventAppService;
use App\Domain\Chat\Event\Agent\UserCallAgentEvent;
use App\Domain\Chat\Service\MagicConversationDomainService;
use App\Domain\Contact\Entity\ValueObject\DataIsolation;
use Dtyq\SuperMagic\Application\SuperAgent\DTO\UserMessageDTO;
use Dtyq\SuperMagic\Application\SuperAgent\Service\HandleUserMessageAppService;
use Dtyq\SuperMagic\Application\SuperAgent\Service\TaskAppService;
use Dtyq\SuperMagic\Domain\SuperAgent\Constant\AgentConstant;
use Dtyq\SuperMagic\Domain\SuperAgent\Entity\ValueObject\ChatInstruction;
use Dtyq\SuperMagic\Domain\SuperAgent\Entity\ValueObject\TaskMode;
use Hyperf\Contract\StdoutLoggerInterface;
use Throwable;

/**
 * Super Agent Service.
 *
 * Responsible for publishing agent messages based on AI code processing
 */
class SuperAgentMessageSubscriberV2 extends MagicAgentEventAppService
{
    public function __construct(
        protected readonly TaskAppService $SuperAgentAppService,
        protected readonly HandleUserMessageAppService $handleUserMessageAppService,
        protected readonly StdoutLoggerInterface $logger,
        MagicConversationDomainService $magicConversationDomainService,
    ) {
        parent::__construct($magicConversationDomainService);
    }

    public function agentExecEvent(UserCallAgentEvent $userCallAgentEvent)
    {
        // Determine if Super Magic needs to be called
        if ($userCallAgentEvent->agentAccountEntity->getAiCode() === AgentConstant::SUPER_MAGIC_CODE) {
            $this->handlerSuperMagicMessage($userCallAgentEvent);
        } else {
            // Process messages through normal agent handling
            parent::agentExecEvent($userCallAgentEvent);
        }
    }

    private function handlerSuperMagicMessage(UserCallAgentEvent $userCallAgentEvent): void
    {
        try {
            $this->logger->info(sprintf(
                'Received super agent message, event: %s',
                json_encode($userCallAgentEvent, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
            ));

            // Extract necessary information
            $conversationId = $userCallAgentEvent->seqEntity->getConversationId() ?? '';
            $chatTopicId = $userCallAgentEvent->seqEntity->getExtra()?->getTopicId() ?? '';
            $organizationCode = $userCallAgentEvent->senderUserEntity->getOrganizationCode() ?? '';
            $userId = $userCallAgentEvent->senderUserEntity->getUserId() ?? '';
            $agentUserId = $userCallAgentEvent->agentUserEntity->getUserId() ?? '';
            $prompt = $userCallAgentEvent->messageEntity?->getMessageContent()?->getContent() ?? '';
            $attachments = $userCallAgentEvent->messageEntity?->getMessageContent()?->getAttachments() ?? [];
            $instructions = $userCallAgentEvent->messageEntity?->getMessageContent()?->getInstructs() ?? [];

            // Parameter validation
            if (empty($conversationId) || empty($chatTopicId) || empty($organizationCode)
                || empty($userId) || empty($agentUserId)) {
                $this->logger->error(sprintf(
                    'Incomplete message parameters, conversation_id: %s, topic_id: %s, organization_code: %s, user_id: %s, agent_user_id: %s',
                    $conversationId,
                    $chatTopicId,
                    $organizationCode,
                    $userId,
                    $agentUserId
                ));
                return;
            }

            // Create data isolation object
            $dataIsolation = DataIsolation::create($organizationCode, $userId);

            // Convert attachments array to JSON
            $attachmentsJson = ! empty($attachments) ? json_encode($attachments, JSON_UNESCAPED_UNICODE) : '';

            // Parse instruction information
            [$chatInstructs, $taskMode] = $this->parseInstructions($instructions);

            // Create user message DTO
            $userMessageDTO = new UserMessageDTO(
                agentUserId: $agentUserId,
                chatConversationId: $conversationId,
                chatTopicId: $chatTopicId,
                prompt: $prompt,
                attachments: $attachmentsJson,
                instruction: $chatInstructs,
                taskMode: $taskMode
            );

            // Call handle user message service
            if ($chatInstructs == ChatInstruction::Interrupted) {
                $this->handleUserMessageAppService->handleInternalMessage($dataIsolation, $userMessageDTO);
            } else {
                $this->handleUserMessageAppService->handleChatMessage($dataIsolation, $userMessageDTO);
            }
            $this->logger->info('Super agent message processing completed');

            return;
        } catch (Throwable $e) {
            $this->logger->error(sprintf(
                'Failed to process super agent message: %s, event: %s',
                $e->getMessage(),
                json_encode($userCallAgentEvent, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
            ));

            return; // Acknowledge message even on error to avoid message accumulation
        }
    }

    /**
     * Parse instructions, extract chat instruction and task mode.
     *
     * @param array $instructions Instruction array
     * @return array Returns [ChatInstruction, string taskMode]
     */
    private function parseInstructions(array $instructions): array
    {
        // Default values
        $chatInstructs = ChatInstruction::Normal;
        $taskMode = '';

        if (empty($instructions)) {
            return [$chatInstructs, $taskMode];
        }

        // Check for matching chat instructions or task modes
        foreach ($instructions as $instruction) {
            $value = $instruction['value'] ?? '';

            // First try to match chat instruction
            $tempChatInstruct = ChatInstruction::tryFrom($value);
            if ($tempChatInstruct !== null) {
                $chatInstructs = $tempChatInstruct;
                continue; // Continue looking for task mode after finding chat instruction
            }

            // Try to match task mode
            $tempTaskMode = TaskMode::tryFrom($value);
            if ($tempTaskMode !== null) {
                $taskMode = $tempTaskMode->value;
                break; // Can end loop after finding task mode
            }
        }
        return [$chatInstructs, $taskMode];
    }
}
