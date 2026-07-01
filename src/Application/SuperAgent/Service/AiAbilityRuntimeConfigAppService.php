<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Application\SuperAgent\Service;

use App\Domain\Provider\Entity\AiAbilityEntity;
use App\Domain\Provider\Entity\ValueObject\AiAbilityCode;
use App\Domain\Provider\Entity\ValueObject\ProviderDataIsolation;
use App\Domain\Provider\Service\AiAbilityDomainService;

/**
 * AI 能力运行时配置应用服务.
 */
readonly class AiAbilityRuntimeConfigAppService
{
    private const RUNTIME_ABILITY_KEY_MAP = [
        AiAbilityCode::VisualUnderstanding->value => 'visual_understanding',
        AiAbilityCode::VideoUnderstanding->value => 'video_understanding',
        AiAbilityCode::ContentSummary->value => 'summarize',
        AiAbilityCode::DeepWrite->value => 'deep_write',
        AiAbilityCode::Purify->value => 'purify',
        AiAbilityCode::SmartFilename->value => 'smart_filename',
        AiAbilityCode::Compact->value => 'compact',
        AiAbilityCode::AnalysisAudio->value => 'analysis_audio',
    ];

    /**
     * 初始化 AI 能力运行时配置应用服务.
     */
    public function __construct(
        private AiAbilityDomainService $aiAbilityDomainService,
    ) {
    }

    /**
     * 获取 AI 能力运行时配置.
     */
    public function getRuntimeConfig(): array
    {
        $dataIsolation = ProviderDataIsolation::create()->disabled();
        $aiAbilities = $this->aiAbilityDomainService->getAll($dataIsolation);

        return [
            'ai_abilities' => $this->buildRuntimeConfigs($aiAbilities),
        ];
    }

    /**
     * 将 AI 能力实体列表转换为运行时配置映射.
     *
     * @param array<AiAbilityEntity> $aiAbilities
     */
    public function buildRuntimeConfigs(array $aiAbilities): array
    {
        $runtimeConfigs = [];

        foreach ($aiAbilities as $aiAbility) {
            if (! $aiAbility instanceof AiAbilityEntity) {
                continue;
            }

            $abilityKey = self::abilityKeyForCode($aiAbility->getCode());
            if ($abilityKey === null) {
                continue;
            }

            $runtimeConfigs[$abilityKey] = $this->buildRuntimeConfig($aiAbility);
        }

        return $runtimeConfigs;
    }

    /**
     * 将 provider 能力编码转换为 super-magic 运行时能力 key.
     */
    private static function abilityKeyForCode(AiAbilityCode $code): ?string
    {
        return self::RUNTIME_ABILITY_KEY_MAP[$code->value] ?? null;
    }

    /**
     * 构建单个 AI 能力的运行时配置.
     */
    private function buildRuntimeConfig(AiAbilityEntity $aiAbility): array
    {
        return [
            'enabled' => $aiAbility->isEnabled(),
            'config' => $aiAbility->getConfig(),
        ];
    }
}
