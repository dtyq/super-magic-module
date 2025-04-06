<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\ModelGateway\Mapper;

use App\Domain\Flow\Entity\ValueObject\FlowDataIsolation;
use App\Domain\Flow\Entity\ValueObject\Query\MagicFlowAIModelQuery;
use App\Domain\Flow\Service\MagicFlowAIModelDomainService;
use App\Domain\ModelAdmin\Constant\ServiceProviderCategory;
use App\Domain\ModelAdmin\Constant\ServiceProviderCode;
use App\Domain\ModelAdmin\Entity\ServiceProviderConfigEntity;
use App\Domain\ModelAdmin\Entity\ServiceProviderModelsEntity;
use App\Domain\ModelAdmin\Entity\ValueObject\ServiceProviderConfigDTO;
use App\Domain\ModelAdmin\Entity\ValueObject\ServiceProviderModelsDTO;
use App\Domain\ModelAdmin\Service\ServiceProviderDomainService;
use App\Domain\ModelGateway\Service\ModelConfigDomainService;
use App\ErrorCode\GenericErrorCode;
use App\Infrastructure\Core\Contract\Model\RerankInterface;
use App\Infrastructure\Core\Exception\ExceptionBuilder;
use App\Infrastructure\Core\ValueObject\Page;
use App\Infrastructure\ExternalAPI\MagicAIApi\MagicAILocalModel;
use Hyperf\Contract\ConfigInterface;
use Hyperf\Odin\Api\RequestOptions\ApiOptions;
use Hyperf\Odin\Contract\Model\EmbeddingInterface;
use Hyperf\Odin\Contract\Model\ModelInterface;
use Hyperf\Odin\Factory\ModelFactory;
use Hyperf\Odin\Model\AbstractModel;
use Hyperf\Odin\Model\ModelOptions;
use Hyperf\Odin\ModelMapper;
use Psr\Log\LoggerInterface;

/**
 * 集合项目本身多套的 ModelGatewayMapper - 最终全部转换为 odin model 参数格式.
 */
class ModelGatewayMapper extends ModelMapper
{
    /**
     * 自定义数据.
     */
    protected array $attributes = [];

    /**
     * @var array<string, RerankInterface>
     */
    protected array $rerank = [];

    public function __construct(protected ConfigInterface $config, protected LoggerInterface $logger)
    {
        parent::__construct($config, $logger);

        // 这里具有优先级的顺序来覆盖配置
        $this->loadFlowModels();
        $this->loadApiModels();
        $this->loadAdminModels();
    }

    public function getChatModelProxy(string $model): ModelInterface
    {
        /** @var AbstractModel $odinModel */
        $odinModel = $this->getModel($model);
        // 转换为代理
        return $this->createProxy($model, $odinModel->getModelOptions(), $odinModel->getApiRequestOptions());
    }

    public function getEmbeddingModelProxy(string $model): EmbeddingInterface
    {
        /** @var AbstractModel $odinModel */
        $odinModel = $this->getEmbeddingModel($model);
        // 转换为代理
        return $this->createProxy($model, $odinModel->getModelOptions(), $odinModel->getApiRequestOptions());
    }

    public function getChatModel(string $model): ModelInterface
    {
        $this->refreshByAdminConfig($model);
        return parent::getChatModel($model);
    }

    public function getEmbeddingModel(string $model): EmbeddingInterface
    {
        $this->refreshByAdminConfig($model);
        return parent::getEmbeddingModel($model);
    }

    public function getChatModels(string $organizationCode): array
    {
        // 加载 admin 配置的所有 llm 模型
        $providerConfigs = di(ServiceProviderDomainService::class)->getActiveModelsByOrganizationCode($organizationCode, ServiceProviderCategory::LLM);
        foreach ($providerConfigs as $providerConfig) {
            if (! $providerConfig->isEnabled()) {
                continue;
            }
            foreach ($providerConfig->getModels() as $providerModel) {
                if (! $providerModel->isActive()) {
                    continue;
                }

                $this->initModelByAdmin($providerConfig, $providerModel);
            }
        }

        return $this->getModels('chat');
    }

    public function getEmbeddingModels(string $organizationCode): array
    {
        // 加载 admin 配置的所有 embedding 模型
        $providerConfigs = di(ServiceProviderDomainService::class)->getActiveModelsByOrganizationCode($organizationCode, ServiceProviderCategory::LLM);
        foreach ($providerConfigs as $providerConfig) {
            if (! $providerConfig->isEnabled()) {
                continue;
            }
            foreach ($providerConfig->getModels() as $providerModel) {
                if (! $providerModel->isActive()) {
                    continue;
                }

                $this->initModelByAdmin($providerConfig, $providerModel);
            }
        }

        return $this->getModels('embedding');
    }

    public function getAttributes(string $modelName): array
    {
        return $this->attributes[$modelName] ?? [];
    }

    private function refreshByAdminConfig(string $model): void
    {
        if (! is_numeric($model)) {
            return;
        }
        // 纯数字考虑去 admin 获取
        $serviceProviderDomainService = di(ServiceProviderDomainService::class);
        $providerModel = $serviceProviderDomainService->getModelById($model);
        if (! $providerModel || ! $providerModel->isActive()) {
            ExceptionBuilder::throw(GenericErrorCode::IllegalOperation, 'common.invalid', ['label' => $model]);
        }
        $providerConfig = $serviceProviderDomainService->getServiceProviderConfigByServiceProviderModel($providerModel);
        if (! $providerConfig || ! $providerConfig->isActive()) {
            ExceptionBuilder::throw(GenericErrorCode::IllegalOperation, 'common.invalid', ['label' => $model]);
        }
        $this->initModelByAdmin($providerModel, $providerConfig);
    }

    private function initModelByAdmin(ServiceProviderConfigDTO|ServiceProviderConfigEntity $providerConfigEntity, ServiceProviderModelsDTO|ServiceProviderModelsEntity $providerModelsEntity): void
    {
        if ($providerConfigEntity instanceof ServiceProviderConfigEntity) {
            $serviceProviderCode = $providerConfigEntity->getProviderCode();
        } else {
            $serviceProviderCode = ServiceProviderCode::tryFrom($providerConfigEntity->getProviderCode());
        }
        $name = (string) $providerModelsEntity->getId();
        $config = $providerConfigEntity->getConfig();
        $modelVersion = $providerModelsEntity->getModelVersion();

        if (! $serviceProviderCode) {
            return;
        }

        $this->addModel($name, [
            'model' => $name,
            'implementation' => $serviceProviderCode->getImplementation(),
            'config' => $serviceProviderCode->getImplementationConfig($config, $modelVersion),
            'model_options' => [
                'chat' => true,
                'function_call' => true,
                'embedding' => false,
                'multi_modal' => false,
                'vector_size' => 0,
            ],
        ]);
        $this->addAttributes($name, [
            'label' => $providerModelsEntity->getName(),
            'icon' => $providerModelsEntity->getIcon(),
            'tags' => [['type' => 1, 'value' => $serviceProviderCode->value]],
            'created_at' => $providerModelsEntity->getCreatedAt(),
            'owner_by' => 'MagicAI',
        ]);
    }

    private function loadAdminModels()
    {
        // 这里是动态数据，就不提前加载了
    }

    private function loadApiModels(): void
    {
        $modelConfigs = di(ModelConfigDomainService::class)->getByModels(['all']);
        foreach ($modelConfigs as $modelConfig) {
            $embedding = str_contains($modelConfig->getModel(), 'embedding');
            $key = $modelConfig->getModel();
            $this->addModel($key, [
                'model' => $modelConfig->getModel(),
                'implementation' => $modelConfig->getImplementation(),
                'config' => $modelConfig->getActualImplementationConfig(),
                // 以前的配置表没有 embedding 相关的配置，所以这里默认都开启
                'model_options' => [
                    'chat' => ! $embedding,
                    'function_call' => true,
                    'embedding' => $embedding,
                    'multi_modal' => ! $embedding,
                    'vector_size' => 0,
                ],
            ]);
            $this->addAttributes($key, [
                'label' => $modelConfig->getName(),
                'icon' => '',
                'tags' => [['type' => 1, 'value' => 'MagicAI']],
                'created_at' => $modelConfig->getCreatedAt(),
                'owner_by' => 'MagicAI',
            ]);
            $this->logger->info('ApiModelRegister', [
                'key' => $key,
                'model' => $modelConfig->getModel(),
                'label' => $modelConfig->getName(),
                'implementation' => $modelConfig->getImplementation(),
            ]);
        }
    }

    private function loadFlowModels(): void
    {
        $query = new MagicFlowAIModelQuery();
        $query->setEnabled(true);
        $page = Page::createNoPage();
        $dataIsolation = FlowDataIsolation::create()->disabled();
        $list = di(MagicFlowAIModelDomainService::class)->queries($dataIsolation, $query, $page)['list'];
        foreach ($list as $modelEntity) {
            $key = $modelEntity->getModelName() ?: $modelEntity->getName();
            $this->addModel($modelEntity->getName(), [
                'model' => $key,
                'implementation' => $modelEntity->getImplementation(),
                'config' => $modelEntity->getActualImplementationConfig(),
                'model_options' => [
                    'chat' => ! $modelEntity->isSupportEmbedding(),
                    'function_call' => true,
                    'embedding' => $modelEntity->isSupportEmbedding(),
                    'multi_modal' => $modelEntity->isSupportMultiModal(),
                    'vector_size' => $modelEntity->getVectorSize(),
                ],
            ]);
            $this->addAttributes($modelEntity->getName(), [
                'label' => $modelEntity->getLabel(),
                'icon' => $modelEntity->getIcon(),
                'tags' => $modelEntity->getTags(),
                'created_at' => $modelEntity->getCreatedAt(),
                'owner_by' => 'MagicAI',
            ]);
            $this->logger->info('FlowModelRegister', [
                'key' => $key,
                'model' => $key,
                'label' => $modelEntity->getLabel(),
                'implementation' => $modelEntity->getImplementation(),
                'display' => $modelEntity->isDisplay(),
            ]);
        }
    }

    private function addAttributes(string $modelName, array $attributes): void
    {
        $this->attributes[$modelName] = $attributes;
    }

    private function createProxy(string $model, ModelOptions $modelOptions, ApiOptions $apiOptions): EmbeddingInterface|ModelInterface
    {
        // 使用ModelFactory创建模型实例
        return ModelFactory::create(
            MagicAILocalModel::class,
            $model,
            [
            ],
            $modelOptions,
            $apiOptions,
            $this->logger
        );
    }
}
