<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\Admin\Service;

use App\Application\Admin\Service\Extra\Factory\ExtraDetailAppenderFactory;
use App\Domain\Admin\Entity\AdminGlobalSettingsEntity;
use App\Domain\Admin\Entity\ValueObject\AdminGlobalSettingsName;
use App\Domain\Admin\Entity\ValueObject\AdminGlobalSettingsType;
use App\Domain\Admin\Entity\ValueObject\AgentFilterType;
use App\Domain\Admin\Entity\ValueObject\Extra\AbstractSettingExtra;
use App\Domain\Admin\Entity\ValueObject\Extra\DefaultFriendExtra;
use App\Domain\Admin\Service\AdminGlobalSettingsDomainService;
use App\Domain\Agent\Entity\MagicAgentEntity;
use App\Domain\Agent\Service\MagicAgentDomainService;
use App\Domain\Agent\Service\MagicAgentVersionDomainService;
use App\Domain\File\Service\FileDomainService;
use App\Infrastructure\Core\Traits\DataIsolationTrait;
use App\Interfaces\Admin\DTO\AgentGlobalSettingsDTO;
use App\Interfaces\Admin\DTO\Extra\Item\AgentItemDTO;
use App\Interfaces\Admin\DTO\Response\GetPublishedAgentsResponseDTO;
use App\Interfaces\Authorization\Web\MagicUserAuthorization;
use Dtyq\CloudFile\Kernel\Struct\FileLink;
use Qbhy\HyperfAuth\Authenticatable;

use function Hyperf\Collection\last;

class AdminAgentAppService
{
    use DataIsolationTrait;

    public function __construct(
        private readonly AdminGlobalSettingsDomainService $globalSettingsDomainService,
        private readonly MagicAgentDomainService $magicAgentDomainService,
        private readonly MagicAgentVersionDomainService $magicAgentVersionDomainService,
        private readonly FileDomainService $fileDomainService,
    ) {
    }

    /**
     * @param MagicUserAuthorization $authorization
     * @return AgentGlobalSettingsDTO[]
     */
    public function getGlobalSettings(Authenticatable $authorization): array
    {
        $dataIsolation = $this->createDataIsolation($authorization);
        $allSettings = [];

        // 只获取 Agent 相关的设置类型
        $agentSettingsTypes = AdminGlobalSettingsType::getAssistantGlobalSettingsType();
        foreach ($agentSettingsTypes as $type) {
            $settings = $this->globalSettingsDomainService->getSettingsByType(
                $type,
                $dataIsolation
            );
            // 组装dto, 补充额外信息
            $settingDTO = (new AgentGlobalSettingsDTO($settings->toArray()));
            ExtraDetailAppenderFactory::createStrategy($settingDTO->getExtra())->appendExtraDetail($settingDTO->getExtra(), $authorization);
            $settingName = AdminGlobalSettingsName::getByType($settings->getType());
            $allSettings[$settingName] = $settingDTO;
        }

        return $allSettings;
    }

    /**
     * @param AgentGlobalSettingsDTO[] $settings
     * @return AgentGlobalSettingsDTO[]
     */
    public function updateGlobalSettings(
        Authenticatable $authorization,
        array $settings
    ): array {
        $dataIsolation = $this->createDataIsolation($authorization);
        $updatedSettings = [];
        $agentSettingsTypes = array_map(fn ($type) => $type->value, AdminGlobalSettingsType::getAssistantGlobalSettingsType());
        $agentSettingsTypes = array_flip($agentSettingsTypes);
        foreach ($settings as $setting) {
            // 如果不是助理创建管理，则不更新
            if (! isset($agentSettingsTypes[$setting->getType()->value])) {
                continue;
            }
            $result = $this->globalSettingsDomainService->updateSettings(
                (new AdminGlobalSettingsEntity())
                    ->setType($setting->getType())
                    ->setStatus($setting->getStatus())
                    ->setExtra(AbstractSettingExtra::fromDataByType($setting->getExtra()->toArray(), $setting->getType())),
                $dataIsolation
            );
            $updatedSettings[] = new AgentGlobalSettingsDTO($result->toArray());
        }

        return $updatedSettings;
    }

    public function getPublishedAgents(Authenticatable $authorization, string $pageToken, int $pageSize, AgentFilterType $type): GetPublishedAgentsResponseDTO
    {
        // 获取数据隔离对象并获取当前组织的组织代码
        /** @var MagicUserAuthorization $authorization */
        $organizationCode = $authorization->getOrganizationCode();

        // 获取启用的机器人列表
        $enabledAgents = $this->magicAgentDomainService->getEnabledAgents();

        // 根据筛选类型过滤
        $enabledAgents = $this->filterEnableAgentsByType($authorization, $enabledAgents, $type);

        // 提取启用机器人列表中的 agent_version_id
        $agentVersionIds = array_column($enabledAgents, 'agent_version_id');

        // 获取指定组织和机器人版本的机器人数据及其总数
        $agentVersions = $this->magicAgentVersionDomainService->getAgentsByOrganizationWithCursor(
            $organizationCode,
            $agentVersionIds,
            $pageToken,
            $pageSize
        );

        if (empty($agentVersions)) {
            return new GetPublishedAgentsResponseDTO();
        }

        // 获取头像url
        $avatars = array_column($agentVersions, 'robot_avatar');
        $fileLinks = $this->fileDomainService->getLinks($organizationCode, $avatars);

        // 转换为AgentItemDTO格式
        /** @var array<AgentItemDTO> $result */
        $result = [];
        foreach ($agentVersions as $agent) {
            /** @var ?FileLink $avatar */
            $avatar = $fileLinks[$agent->getRobotAvatar()] ?? null;
            $item = new AgentItemDTO();
            $item->setRootId($agent->getRootId());
            $item->setName($agent->getRobotName());
            $item->setAvatar($avatar?->getUrl() ?? '');
            $result[] = $item;
        }
        /** @var AgentItemDTO $lastAgent */
        $lastAgent = last($result);
        $hasMore = count($agentVersions) === $pageSize;
        return new GetPublishedAgentsResponseDTO([
            'items' => $result,
            'has_more' => $hasMore,
            'page_token' => $lastAgent->getRootId(),
        ]);
    }

    /**
     * @param array<MagicAgentEntity> $enabledAgents
     * @return array<MagicAgentEntity>
     */
    private function filterEnableAgentsByType(Authenticatable $authorization, array $enabledAgents, AgentFilterType $type): array
    {
        if ($type === AgentFilterType::ALL) {
            return $enabledAgents;
        }

        $selectedDefaultFriendRootIds = array_flip($this->getSelectedDefaultFriendRootIds($authorization));
        // 如果type为SELECTED_DEFAULT_FRIEND，则只返回选中的默认好友
        if ($type === AgentFilterType::SELECTED_DEFAULT_FRIEND) {
            return array_filter($enabledAgents, function ($agent) use ($selectedDefaultFriendRootIds) {
                return isset($selectedDefaultFriendRootIds[$agent->getId()]);
            });
        }
        // 如果type为NOT_SELECTED_DEFAULT_FRIEND，则只返回未选中的默认好友
        if ($type === AgentFilterType::NOT_SELECTED_DEFAULT_FRIEND) {
            return array_filter($enabledAgents, function ($agent) use ($selectedDefaultFriendRootIds) {
                return ! isset($selectedDefaultFriendRootIds[$agent->getId()]);
            });
        }
        /* @phpstan-ignore-next-line */
        return $enabledAgents;
    }

    /**
     * @return array<string>
     */
    private function getSelectedDefaultFriendRootIds(Authenticatable $authorization): array
    {
        $dataIsolation = $this->createDataIsolation($authorization);
        $settings = $this->globalSettingsDomainService->getSettingsByType(AdminGlobalSettingsType::DEFAULT_FRIEND, $dataIsolation);
        /** @var ?DefaultFriendExtra $extra */
        $extra = $settings->getExtra();
        return $extra ? $extra->getSelectedAgentRootIds() : [];
    }
}
