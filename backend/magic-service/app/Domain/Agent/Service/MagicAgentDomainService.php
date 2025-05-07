<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\Agent\Service;

use App\Domain\Agent\Constant\InstructType;
use App\Domain\Agent\Constant\MagicAgentVersionStatus;
use App\Domain\Agent\Constant\SystemInstructType;
use App\Domain\Agent\Entity\MagicAgentEntity;
use App\Domain\Agent\Entity\ValueObject\Query\MagicAgentQuery;
use App\Domain\Agent\Event\MagicAgentSavedEvent;
use App\Domain\Agent\Factory\MagicAgentVersionFactory;
use App\Domain\Agent\Repository\Persistence\MagicAgentRepository;
use App\Domain\Agent\Repository\Persistence\MagicAgentVersionRepository;
use App\Domain\File\Repository\Persistence\Facade\CloudFileRepositoryInterface;
use App\ErrorCode\AgentErrorCode;
use App\Infrastructure\Core\Exception\ExceptionBuilder;
use App\Infrastructure\Core\ValueObject\Page;
use App\Infrastructure\Util\Context\RequestContext;
use App\Interfaces\Admin\DTO\Request\QueryPageAgentDTO;
use Dtyq\AsyncEvent\AsyncEventUtil;
use Hyperf\DbConnection\Db;

/**
 * 助理 service.
 */
class MagicAgentDomainService
{
    public function __construct(
        public MagicAgentRepository $agentRepository,
        public MagicAgentVersionRepository $agentVersionRepository,
        protected readonly CloudFileRepositoryInterface $cloudFileRepository
    ) {
    }

    /**
     * @return array{total: int, list: array<MagicAgentEntity>}
     */
    public function queries(MagicAgentQuery $query, Page $page): array
    {
        return $this->agentRepository->queries($query, $page);
    }

    public function getByFlowCode(string $flowCode): MagicAgentEntity
    {
        $agent = $this->agentRepository->getByFlowCode($flowCode);
        if (empty($agent)) {
            ExceptionBuilder::throw(AgentErrorCode::VALIDATE_FAILED, 'common.not_found', ['label' => $flowCode]);
        }
        return $agent;
    }

    /**
     * @return MagicAgentEntity[]
     */
    public function getByFlowCodes(array $flowCodes): array
    {
        return $this->agentRepository->getByFlowCodes($flowCodes);
    }

    public function saveAgent(MagicAgentEntity $agentEntity): MagicAgentEntity
    {
        $create = false;
        if (empty($agentEntity->getId())) {
            $agent = $this->agentRepository->insert($agentEntity);
            $create = true;

            // 创建助理时添加系统交互指令
            $this->initSystemInstructs($agent->getOrganizationCode(), $agent->getId(), $agentEntity->getUpdatedUid());
        } else {
            // 是否能修改
            $agent = $this->getAgentById($agentEntity->getId());
            $agent->setRobotName($agentEntity->getAgentName());
            $agent->setRobotDescription($agentEntity->getAgentDescription());
            $agent->setRobotAvatar($agentEntity->getAgentAvatar());

            $agent->setAgentName($agentEntity->getAgentName());
            $agent->setAgentDescription($agentEntity->getAgentDescription());
            $agent->setAgentAvatar($agentEntity->getAgentAvatar());

            $agent->setStartPage($agentEntity->getStartPage());
            $agent = $this->agentRepository->updateById($agent);
        }
        AsyncEventUtil::dispatch(new MagicAgentSavedEvent($agent, $create));
        return $agent;
    }

    public function deleteAgentById(string $id, string $organizationCode): bool
    {
        if (empty($id)) {
            ExceptionBuilder::throw(AgentErrorCode::VALIDATE_FAILED);
        }
        Db::transaction(function () use ($id, $organizationCode) {
            // 删除助理
            $this->agentRepository->deleteAgentById($id, $organizationCode);
            $this->agentVersionRepository->deleteByAgentId($id, $organizationCode);
        });
        return true;
    }

    public function getAgentById(string $agentId): MagicAgentEntity
    {
        return $this->agentRepository->getAgentById($agentId);
    }

    public function updateDefaultVersion(string $agentId, string $versionId): void
    {
        $this->agentRepository->updateDefaultVersion($agentId, $versionId);
    }

    public function updateAgentStatus(string $agentId, int $status): void
    {
        if ($status !== MagicAgentVersionStatus::ENTERPRISE_ENABLED->value && $status !== MagicAgentVersionStatus::ENTERPRISE_DISABLED->value) {
            ExceptionBuilder::throw(AgentErrorCode::VALIDATE_FAILED, 'agent.agent_status_only_enable_or_disable');
        }

        $magicAgentEntity = new MagicAgentEntity();
        $magicAgentEntity->setId($agentId);
        $magicAgentEntity->setStatus($status);
        $this->agentRepository->updateStatus($agentId, $status);
    }

    /**
     * @return MagicAgentEntity[]
     */
    public function getEnabledAgents(): array
    {
        return $this->agentRepository->getEnabledAgents();
    }

    public function getById(string $agentId): MagicAgentEntity
    {
        return $this->agentRepository->getById($agentId);
    }

    public function getEnterpriseAvailableAgentIds(string $organizationCode): array
    {
        return $this->agentVersionRepository->getEnterpriseAvailableAgentIds($organizationCode);
    }

    public function getDefaultConversationAICodes(): array
    {
        $aiCodes = config('agent.default_conversation_ai_codes');
        if (! empty($aiCodes)) {
            return explode(',', $aiCodes);
        }
        return ['MAGIC-FLOW-676e4a53b17378-40076235'];
    }

    public function insertDefaultAssistantConversation(string $userId, string $aiCode): void
    {
        $this->agentRepository->insertDefaultAssistantConversation($userId, $aiCode);
    }

    public function isDefaultAssistantConversationExist(string $userId, string $aiCode): bool
    {
        return $this->agentRepository->isDefaultAssistantConversationExist($userId, $aiCode);
    }

    // 商业代码目前还依赖
    public function getBotsByOrganization(RequestContext $requestContext, string $agentName, ?string $pageToken = null, int $pageSize = 50, ?string $descriptionKeyword = null): array
    {
        // 获取数据隔离对象并获取当前组织的组织代码
        $organizationCode = $requestContext->getUserAuthorization()->getOrganizationCode();

        // 获取启用的助理列表
        $enabledAgents = $this->getEnabledAgents();

        // 提取启用助理列表中的 agent_version_id
        $agentVersionIds = array_column($enabledAgents, 'agent_version_id');

        // 获取指定组织和助理版本的助理数据及其总数
        $page = ((int) ceil((int) $pageToken / $pageSize)) + 1;
        $agents = $this->agentVersionRepository->getAgentsByOrganization($organizationCode, $agentVersionIds, $page, $pageSize, $agentName, $descriptionKeyword);

        if (empty($agents)) {
            return [];
        }

        $agents = MagicAgentVersionFactory::toArrays($agents);
        // 收集助理的流程代码并获取每个助理的头像链接
        foreach ($agents as &$agent) {
            // 获取助理的头像链接
            $fileLinks = $this->cloudFileRepository->getLinks($organizationCode, [$agent['agent_avatar']]);
            $fileKey = array_key_first($fileLinks);
            $fileLink = $fileLinks[$fileKey] ?? null;
            $agent['agent_avatar'] = $fileLink?->getUrl() ?? '';
        }
        return $agents;
    }

    /**
     * @return array<MagicAgentEntity>
     */
    public function getAgentByIds(array $agentIds): array
    {
        return $this->agentRepository->getAgentByIds($agentIds);
    }

    /**
     * 保存助理的交互指令.
     */
    public function updateInstruct(string $organizationCode, string $agentId, array $instructs, string $userId = '', bool $valid = true): array
    {
        if ($valid) {
            // 校验普通交互指令
            InstructType::validateInstructs($instructs);

            // 确保系统交互指令存在，如果缺少则补充
            $instructs = SystemInstructType::ensureSystemInstructs($instructs);
        }
        // 保存
        $this->agentRepository->updateInstruct($organizationCode, $agentId, $instructs, $userId);
        return $instructs;
    }

    public function associateFlowWithAgent(string $agentId, string $flowCode): void
    {
        $this->agentRepository->updateFlowCode($agentId, $flowCode);
    }

    /**
     * 查询企业下的所有助理,条件查询：状态，创建人，搜索.
     * @return array<MagicAgentEntity>
     */
    public function queriesAgents(string $organizationCode, QueryPageAgentDTO $queryPageAgentDTO): array
    {
        return $this->agentRepository->queriesAgents($organizationCode, $queryPageAgentDTO);
    }

    public function queriesAgentsCount(string $organizationCode, QueryPageAgentDTO $queryPageAgentDTO): int
    {
        return $this->agentRepository->queriesAgentsCount($organizationCode, $queryPageAgentDTO);
    }

    /**
     * 获取企业下的所有助理创建者.
     * @return array<string>
     */
    public function getOrganizationAgentsCreators(string $organizationCode): array
    {
        return $this->agentRepository->getOrganizationAgentsCreators($organizationCode);
    }

    /**
     * 初始化系统交互指令.
     */
    private function initSystemInstructs(string $organizationCode, string $agentId, string $userId): void
    {
        $systemInstructs = SystemInstructType::getDefaultInstructs();
        $this->agentRepository->updateInstruct($organizationCode, $agentId, $systemInstructs, $userId);
    }
}
