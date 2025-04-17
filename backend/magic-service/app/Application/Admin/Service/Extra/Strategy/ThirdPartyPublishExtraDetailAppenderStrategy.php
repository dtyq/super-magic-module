<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\Admin\Service\Extra\Strategy;

use App\Application\Chat\Service\MagicAgentAppService;
use App\Domain\Agent\Entity\MagicAgentEntity;
use App\Interfaces\Admin\DTO\Extra\AbstractSettingExtraDTO;
use App\Interfaces\Admin\DTO\Extra\ThirdPartyPublishExtraDTO;
use App\Interfaces\Authorization\Web\MagicUserAuthorization;
use InvalidArgumentException;

class ThirdPartyPublishExtraDetailAppenderStrategy implements ExtraDetailAppenderStrategyInterface
{
    public function appendExtraDetail(AbstractSettingExtraDTO $extraDTO, MagicUserAuthorization $userAuthorization): AbstractSettingExtraDTO
    {
        if (! $extraDTO instanceof ThirdPartyPublishExtraDTO) {
            throw new InvalidArgumentException('Expected ThirdPartyPublishExtraDTO');
        }

        $this->appendSelectedAgentsInfo($extraDTO, $userAuthorization);

        return $extraDTO;
    }

    public function appendSelectedAgentsInfo(ThirdPartyPublishExtraDTO $extraDTO, ?MagicUserAuthorization $userAuthorization): self
    {
        $agentRootIds = array_column($extraDTO->getSelectedAgents(), 'root_id');
        $agentEntities = $this->getMagicAgentAppService()->getAgentsForAdmin($agentRootIds, $userAuthorization);
        /** @var array<int, MagicAgentEntity> $agentEntities */
        $agentEntities = array_column($agentEntities, null, 'id');
        foreach ($extraDTO->getSelectedAgents() as $selectedAgent) {
            $agentEntity = $agentEntities[(int) $selectedAgent->getRootId()] ?? null;
            $selectedAgent->setName($agentEntity?->getAgentName())
                ->setAvatar($agentEntity?->getAgentAvatar());
        }
        return $this;
    }

    private function getMagicAgentAppService(): MagicAgentAppService
    {
        return di(MagicAgentAppService::class);
    }
}
