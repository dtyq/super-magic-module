<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\Chat\Service;

use App\Domain\Agent\Entity\MagicAgentEntity;
use App\Domain\Agent\Service\MagicAgentDomainService;
use App\Domain\Contact\Entity\ValueObject\DataIsolation;
use App\Domain\Contact\Service\MagicUserDomainService;
use App\Domain\File\Service\FileDomainService;
use App\ErrorCode\AgentErrorCode;
use App\Infrastructure\Core\Exception\ExceptionBuilder;
use App\Interfaces\Authorization\Web\MagicUserAuthorization;
use Qbhy\HyperfAuth\Authenticatable;

class MagicAgentAppService extends AbstractAppService
{
    public function __construct(
        private readonly MagicUserDomainService $userDomainService,
        private readonly MagicAgentDomainService $magicAgentDomainService,
        private readonly FileDomainService $fileDomainService,
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

    /**
     * @param MagicUserAuthorization $authenticatable
     * @return MagicAgentEntity[]
     */
    public function getAgentsForAdmin(array $botIds, Authenticatable $authenticatable): array
    {
        // 获取机器人信息
        $magicBotEntities = $this->magicAgentDomainService->getAgentByIds($botIds);

        $filePaths = array_column($magicBotEntities, 'avatar');
        $fileLinks = $this->fileDomainService->getLinks($authenticatable->getOrganizationCode(), $filePaths);

        foreach ($magicBotEntities as $magicBotEntity) {
            $fileLink = $fileLinks[$magicBotEntity->getRobotAvatar()] ?? null;
            $magicBotEntity->setRobotAvatar($fileLink?->getUrl() ?? '');
        }
        return $magicBotEntities;
    }
}
