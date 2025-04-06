<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\Chat\Service;

use App\Domain\Agent\Service\MagicAgentDomainService;
use App\Domain\Contact\Entity\ValueObject\DataIsolation;
use App\Domain\Contact\Service\MagicUserDomainService;
use App\ErrorCode\AgentErrorCode;
use App\Infrastructure\Core\Exception\ExceptionBuilder;

class MagicAgentAppService extends AbstractAppService
{
    public function __construct(
        private readonly MagicUserDomainService $userDomainService,
        private readonly MagicAgentDomainService $magicAgentDomainService,
    ) {
    }

    public function square(): array
    {
        // 返回 agent 列表信息
        return $this->userDomainService->getAgentList();
    }

    public function getAgentUserId(string $agentId = ''): string
    {
        $flow = $this->magicAgentDomainService->getAgentById($agentId);
        if (empty($flow->getFlowCode())) {
            ExceptionBuilder::throw(AgentErrorCode::AGENT_NOT_FOUND, 'flow_code not found');
        }
        $flowCode = $flow->getFlowCode();

        $dataIsolation = DataIsolation::create();
        $dataIsolation->setCurrentOrganizationCode($flow->getOrganizationCode());
        // 根据flowCode 查询user_id
        $magicUserEntity = $this->userDomainService->getByAiCode($dataIsolation, $flowCode);
        if (empty($magicUserEntity->getUserId())) {
            ExceptionBuilder::throw(AgentErrorCode::AGENT_NOT_FOUND, 'agent_user_id not found');
        }
        return $magicUserEntity->getUserId();
    }
}
