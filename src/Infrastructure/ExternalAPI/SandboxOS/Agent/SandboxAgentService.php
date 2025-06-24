<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Infrastructure\ExternalAPI\SandboxOS\Agent;

use Dtyq\SuperMagic\Infrastructure\ExternalAPI\SandboxOS\AbstractSandboxOS;
use Dtyq\SuperMagic\Infrastructure\ExternalAPI\SandboxOS\Agent\Request\ChatMessageRequest;
use Dtyq\SuperMagic\Infrastructure\ExternalAPI\SandboxOS\Agent\Request\InitAgentRequest;
use Dtyq\SuperMagic\Infrastructure\ExternalAPI\SandboxOS\Agent\Request\InterruptRequest;
use Dtyq\SuperMagic\Infrastructure\ExternalAPI\SandboxOS\Agent\Response\AgentResponse;
use Dtyq\SuperMagic\Infrastructure\ExternalAPI\SandboxOS\Gateway\SandboxGatewayInterface;
use Exception;
use Hyperf\Logger\LoggerFactory;

/**
 * 沙箱Agent服务实现
 * 通过Gateway转发机制与Agent通信
 */
class SandboxAgentService extends AbstractSandboxOS implements SandboxAgentInterface
{
    public function __construct(
        LoggerFactory $loggerFactory,
        private SandboxGatewayInterface $gateway
    ) {
        parent::__construct($loggerFactory);
    }

    /**
     * 初始化Agent.
     */
    public function initAgent(string $sandboxId, InitAgentRequest $request): AgentResponse
    {
        $this->logger->info('[Sandbox][Agent] Initializing agent', [
            'sandbox_id' => $sandboxId,
            'user_id' => $request->getUserId(),
            'task_mode' => $request->getTaskMode(),
        ]);

        try {
            // 通过Gateway转发到Agent API - 根据文档使用统一的 /api/v1/messages/chat 端点
            $result = $this->gateway->proxySandboxRequest(
                $sandboxId,
                'POST',
                'api/v1/messages/chat',
                $request->toArray()
            );

            $response = AgentResponse::fromGatewayResult($result);

            if ($response->isSuccess()) {
                $this->logger->info('[Sandbox][Agent] Agent initialized successfully', [
                    'sandbox_id' => $sandboxId,
                    'agent_id' => $response->getAgentId(),
                ]);
            } else {
                $this->logger->error('[Sandbox][Agent] Failed to initialize agent', [
                    'sandbox_id' => $sandboxId,
                    'code' => $response->getCode(),
                    'message' => $response->getMessage(),
                ]);
            }

            return $response;
        } catch (Exception $e) {
            $this->logger->error('[Sandbox][Agent] Unexpected error when initializing agent', [
                'sandbox_id' => $sandboxId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return AgentResponse::fromApiResponse([
                'code' => 2000,
                'message' => 'Unexpected error: ' . $e->getMessage(),
                'data' => [],
            ]);
        }
    }

    /**
     * 发送聊天消息给Agent.
     */
    public function sendChatMessage(string $sandboxId, ChatMessageRequest $request): AgentResponse
    {
        $this->logger->debug('[Sandbox][Agent] Sending chat message to agent', [
            'sandbox_id' => $sandboxId,
            'user_id' => $request->getUserId(),
            'task_id' => $request->getTaskId(),
            'prompt_length' => strlen($request->getPrompt()),
        ]);

        try {
            // 通过Gateway转发到Agent API - 根据文档使用统一的 /api/v1/messages/chat 端点
            $result = $this->gateway->proxySandboxRequest(
                $sandboxId,
                'POST',
                'api/v1/messages/chat',
                $request->toArray()
            );

            $response = AgentResponse::fromGatewayResult($result);

            $this->logger->debug('[Sandbox][Agent] Chat message sent to agent', [
                'sandbox_id' => $sandboxId,
                'success' => $response->isSuccess(),
                'message_id' => $response->getMessageId(),
                'has_response' => $response->hasResponseMessage(),
            ]);

            return $response;
        } catch (Exception $e) {
            $this->logger->error('[Sandbox][Agent] Unexpected error when sending chat message', [
                'sandbox_id' => $sandboxId,
                'error' => $e->getMessage(),
            ]);

            return AgentResponse::fromApiResponse([
                'code' => 2000,
                'message' => 'Unexpected error: ' . $e->getMessage(),
                'data' => [],
            ]);
        }
    }

    /**
     * 发送中断消息给Agent.
     */
    public function sendInterruptMessage(string $sandboxId, InterruptRequest $request): AgentResponse
    {
        $this->logger->info('[Sandbox][Agent] Sending interrupt message to agent', [
            'sandbox_id' => $sandboxId,
            'user_id' => $request->getUserId(),
            'task_id' => $request->getTaskId(),
            'remark' => $request->getRemark(),
        ]);

        try {
            // 通过Gateway转发到Agent API - 根据文档使用统一的 /api/v1/messages/chat 端点
            $result = $this->gateway->proxySandboxRequest(
                $sandboxId,
                'POST',
                'api/v1/messages/chat',
                $request->toArray()
            );

            $response = AgentResponse::fromGatewayResult($result);

            if ($response->isSuccess()) {
                $this->logger->info('[Sandbox][Agent] Interrupt message sent successfully', [
                    'sandbox_id' => $sandboxId,
                    'user_id' => $request->getUserId(),
                    'task_id' => $request->getTaskId(),
                ]);
            } else {
                $this->logger->error('[Sandbox][Agent] Failed to send interrupt message', [
                    'sandbox_id' => $sandboxId,
                    'code' => $response->getCode(),
                    'message' => $response->getMessage(),
                ]);
            }

            return $response;
        } catch (Exception $e) {
            $this->logger->error('[Sandbox][Agent] Unexpected error when sending interrupt message', [
                'sandbox_id' => $sandboxId,
                'error' => $e->getMessage(),
            ]);

            return AgentResponse::fromApiResponse([
                'code' => 2000,
                'message' => 'Unexpected error: ' . $e->getMessage(),
                'data' => [],
            ]);
        }
    }

    /**
     * 获取工作区状态.
     */
    public function getWorkspaceStatus(string $sandboxId): AgentResponse
    {
        $this->logger->debug('[Sandbox][Agent] Getting workspace status', [
            'sandbox_id' => $sandboxId,
        ]);

        try {
            // 通过Gateway转发到Agent API - 获取工作区状态
            $result = $this->gateway->proxySandboxRequest(
                $sandboxId,
                'GET',
                'api/v1/workspace/status',
                []
            );

            $response = AgentResponse::fromGatewayResult($result);

            $this->logger->debug('[Sandbox][Agent] Workspace status retrieved', [
                'sandbox_id' => $sandboxId,
                'success' => $response->isSuccess(),
                'status' => $response->getDataValue('status'),
            ]);

            return $response;
        } catch (Exception $e) {
            $this->logger->error('[Sandbox][Agent] Unexpected error when getting workspace status', [
                'sandbox_id' => $sandboxId,
                'error' => $e->getMessage(),
            ]);

            return AgentResponse::fromApiResponse([
                'code' => 2000,
                'message' => 'Unexpected error: ' . $e->getMessage(),
                'data' => [],
            ]);
        }
    }
}
