<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\ModelGateway\Service;

use App\Application\ModelGateway\Mapper\ModelGatewayMapper;
use App\Domain\ModelGateway\Entity\ModelConfigEntity;
use App\Domain\ModelGateway\Entity\ValueObject\LLMDataIsolation;
use App\Domain\ModelGateway\Entity\ValueObject\Query\ModelConfigQuery;
use App\Domain\ModelGateway\Repository\Facade\ModelConfigRepositoryInterface;
use App\ErrorCode\MagicApiErrorCode;
use App\Infrastructure\Core\Exception\ExceptionBuilder;
use App\Infrastructure\Core\ValueObject\Page;

class ModelConfigDomainService extends AbstractDomainService
{
    public function __construct(
        private readonly ModelConfigRepositoryInterface $magicApiModelConfigRepository,
    ) {
    }

    public function save(LLMDataIsolation $dataIsolation, ModelConfigEntity $modelConfigEntity): ModelConfigEntity
    {
        $modelConfigEntity->prepareForSaving();
        return $this->magicApiModelConfigRepository->save($dataIsolation, $modelConfigEntity);
    }

    public function show(LLMDataIsolation $dataIsolation, string $model): ModelConfigEntity
    {
        $modelConfig = $this->magicApiModelConfigRepository->getByModel($dataIsolation, $model);
        if (! $modelConfig) {
            ExceptionBuilder::throw(MagicApiErrorCode::ValidateFailed, 'common.not_found', ['label' => $model]);
        }
        return $modelConfig;
    }

    /**
     * @return array{total: int, list: ModelConfigEntity[]}
     */
    public function queries(LLMDataIsolation $dataIsolation, Page $page, ModelConfigQuery $modelConfigQuery): array
    {
        return $this->magicApiModelConfigRepository->queries($dataIsolation, $page, $modelConfigQuery);
    }

    public function getByModel(string $model): ?ModelConfigEntity
    {
        $dataIsolation = LLMDataIsolation::create();
        return $this->magicApiModelConfigRepository->getByModel($dataIsolation, $model);
    }

    /**
     * @return array<ModelConfigEntity>
     */
    public function getByModels(array $models): array
    {
        $dataIsolation = LLMDataIsolation::create();
        return $this->magicApiModelConfigRepository->getByModels($dataIsolation, $models);
    }

    /**
     * 根据ID获取模型配置.
     */
    public function getById(string $id): ?ModelConfigEntity
    {
        $dataIsolation = LLMDataIsolation::create();
        return $this->magicApiModelConfigRepository->getById($dataIsolation, $id);
    }

    /**
     * 根据ID获取模型配置, 不存在则抛出异常.
     */
    public function showById(string $id): ModelConfigEntity
    {
        $dataIsolation = LLMDataIsolation::create();
        $modelConfig = $this->magicApiModelConfigRepository->getById($dataIsolation, $id);
        if (! $modelConfig) {
            ExceptionBuilder::throw(MagicApiErrorCode::ValidateFailed, 'common.not_found', ['label' => "ID: {$id}"]);
        }
        return $modelConfig;
    }

    /**
     * 根据endpoint或type获取模型配置.
     */
    public function getByEndpointOrType(string $endpointOrType): ?ModelConfigEntity
    {
        $dataIsolation = LLMDataIsolation::create();
        return $this->magicApiModelConfigRepository->getByEndpointOrType($dataIsolation, $endpointOrType);
    }

    public function incrementUseAmount(LLMDataIsolation $dataIsolation, ModelConfigEntity $modelConfig, float $amount): void
    {
        $this->magicApiModelConfigRepository->incrementUseAmount($dataIsolation, $modelConfig, $amount);
    }

    /**
     * 获取模型的降级链，合并用户传入的降级链与系统默认的降级链.
     *
     * @param string $modelType 指定的模型类型
     * @param string[] $modelFallbackChain 用户传入的降级链
     *
     * @return string 最终的模型类型
     */
    public function getChatModelTypeByFallbackChain(string $orgCode, string $modelType = '', array $modelFallbackChain = []): string
    {
        // 从组织可用的模型列表中获取所有可聊天的模型
        $odinModels = di(ModelGatewayMapper::class)->getChatModels($orgCode) ?? [];
        $chatModelsName = array_keys($odinModels);
        if (empty($chatModelsName)) {
            return '';
        }

        // 如果指定了模型类型且该模型存在于可用模型列表中，则直接返回
        if (! empty($modelType) && in_array($modelType, $chatModelsName)) {
            return $modelType;
        }

        // 将可用模型转为哈希表，实现O(1)时间复杂度的查找
        $availableModels = array_flip($chatModelsName);

        // 获取系统默认的降级链
        $systemFallbackChain = config('magic-api.model_fallback_chain.chat', []);

        // 合并用户传入的降级链与系统默认的降级链
        // 用户传入的降级链优先级更高
        $mergedFallbackChain = array_merge($systemFallbackChain, $modelFallbackChain);

        // 按优先级顺序遍历合并后的降级链
        foreach ($mergedFallbackChain as $modelName) {
            if (isset($availableModels[$modelName])) {
                return $modelName;
            }
        }

        // 后备方案：如果没有匹配任何优先模型，使用第一个可用模型
        return $chatModelsName[0] ?? '';
    }
}
