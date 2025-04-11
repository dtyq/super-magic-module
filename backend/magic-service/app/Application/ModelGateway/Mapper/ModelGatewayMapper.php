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
use DateTime;
use Hyperf\Contract\ConfigInterface;
use Hyperf\Odin\Api\RequestOptions\ApiOptions;
use Hyperf\Odin\Contract\Model\EmbeddingInterface;
use Hyperf\Odin\Contract\Model\ModelInterface;
use Hyperf\Odin\Factory\ModelFactory;
use Hyperf\Odin\Model\AbstractModel;
use Hyperf\Odin\Model\ModelOptions;
use Hyperf\Odin\ModelMapper;
use InvalidArgumentException;
use Psr\Log\LoggerInterface;
use Throwable;

/**
 * 集合项目本身多套的 ModelGatewayMapper - 最终全部转换为 odin model 参数格式.
 */
class ModelGatewayMapper extends ModelMapper
{
    /**
     * 持久化的自定义数据.
     * @var array<string, OdinModelAttributes>
     */
    protected array $attributes = [];

    /**
     * @var array<string, RerankInterface>
     */
    protected array $rerank = [];

    public function __construct(protected ConfigInterface $config, protected LoggerInterface $logger)
    {
        $this->models['chat'] = [];
        $this->models['embedding'] = [];
        parent::__construct($config, $logger);

        // 这里具有优先级的顺序来覆盖配置
        $this->loadEnvModels();
        $this->loadFlowModels();
        $this->loadApiModels();
        $this->loadAdminModels();
    }

    public function exist(string $model): bool
    {
        if (isset($this->models['chat'][$model]) || isset($this->models['embedding'][$model])) {
            return true;
        }
        return (bool) $this->getByAdmin($model);
    }

    /**
     * 内部使用 chat 时，一定是使用该方法.
     * 会自动替代为本地代理模型.
     */
    public function getChatModelProxy(string $model): ModelInterface
    {
        /** @var AbstractModel $odinModel */
        $odinModel = $this->getChatModel($model);
        // 转换为代理
        return $this->createProxy($model, $odinModel->getModelOptions(), $odinModel->getApiRequestOptions());
    }

    /**
     * 内部使用 embedding 时，一定是使用该方法.
     * 会自动替代为本地代理模型.
     */
    public function getEmbeddingModelProxy(string $model): EmbeddingInterface
    {
        /** @var AbstractModel $odinModel */
        $odinModel = $this->getEmbeddingModel($model);
        // 转换为代理
        return $this->createProxy($model, $odinModel->getModelOptions(), $odinModel->getApiRequestOptions());
    }

    /**
     * 该方法获取到的一定是真实调用的模型.
     *
     * 仅 ModelGateway 领域使用
     */
    public function getChatModel(string $model): ModelInterface
    {
        $odinModel = $this->getByAdmin($model);
        if ($odinModel) {
            return $odinModel->getModel();
        }
        return parent::getChatModel($model);
    }

    /**
     * 该方法获取到的一定是真实调用的模型.
     *
     * 仅 ModelGateway 领域使用
     */
    public function getEmbeddingModel(string $model): EmbeddingInterface
    {
        $odinModel = $this->getByAdmin($model);
        if ($odinModel) {
            return $odinModel->getModel();
        }
        return parent::getEmbeddingModel($model);
    }

    /**
     * 获取当前组织下的所有可用 chat 模型.
     * @return OdinModel[]
     */
    public function getChatModels(string $organizationCode): array
    {
        return $this->getModelsByType($organizationCode, 'chat');
    }

    /**
     * 获取当前组织下的所有可用 embedding 模型.
     */
    public function getEmbeddingModels(string $organizationCode): array
    {
        return $this->getModelsByType($organizationCode, 'embedding');
    }

    protected function loadEnvModels(): void
    {
        // env 添加的模型增加上 attributes
        foreach ($this->models['chat'] as $name => $model) {
            $this->attributes[$name] = new OdinModelAttributes(
                key: $name,
                name: $name,
                label: $name,
                icon: '',
                tags: [['type' => 1, 'value' => 'MagicAI']],
                createdAt: new DateTime(),
                owner: 'MagicOdin',
            );
        }
        foreach ($this->models['embedding'] as $name => $model) {
            $this->attributes[$name] = new OdinModelAttributes(
                key: $name,
                name: $name,
                label: $name,
                icon: '',
                tags: [['type' => 1, 'value' => 'MagicAI']],
                createdAt: new DateTime(),
                owner: 'MagicOdin',
            );
        }
    }

    protected function loadAdminModels()
    {
        // 这里是动态数据，就不提前加载了
    }

    protected function loadApiModels(): void
    {
        $modelConfigs = di(ModelConfigDomainService::class)->getByModels(['all']);
        foreach ($modelConfigs as $modelConfig) {
            $embedding = str_contains($modelConfig->getModel(), 'embedding');
            $key = $modelConfig->getModel();
            try {
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
                $this->addAttributes(
                    key: $key,
                    attributes: new OdinModelAttributes(
                        key: $key,
                        name: $key,
                        label: $modelConfig->getName(),
                        icon: '',
                        tags: [['type' => 1, 'value' => 'MagicAI']],
                        createdAt: $modelConfig->getCreatedAt(),
                        owner: 'MagicAI',
                    )
                );
                $this->logger->info('ApiModelRegister', [
                    'key' => $key,
                    'model' => $modelConfig->getModel(),
                    'label' => $modelConfig->getName(),
                    'implementation' => $modelConfig->getImplementation(),
                ]);
            } catch (Throwable $exception) {
                $this->logger->warning('ApiModelRegisterWarning', [
                    'key' => $key,
                    'model' => $modelConfig->getModel(),
                    'label' => $modelConfig->getName(),
                    'implementation' => $modelConfig->getImplementation(),
                    'error' => $exception->getMessage(),
                ]);
            }
        }
    }

    protected function loadFlowModels(): void
    {
        $query = new MagicFlowAIModelQuery();
        $query->setEnabled(true);
        $page = Page::createNoPage();
        $dataIsolation = FlowDataIsolation::create()->disabled();
        $list = di(MagicFlowAIModelDomainService::class)->queries($dataIsolation, $query, $page)['list'];
        foreach ($list as $modelEntity) {
            $key = $modelEntity->getModelName() ?: $modelEntity->getName();
            try {
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
                $this->addAttributes(
                    key: $modelEntity->getName(),
                    attributes: new OdinModelAttributes(
                        key: $modelEntity->getName(),
                        name: $modelEntity->getName(),
                        label: $modelEntity->getLabel(),
                        icon: $modelEntity->getIcon(),
                        tags: $modelEntity->getTags(),
                        createdAt: $modelEntity->getCreatedAt(),
                        owner: 'MagicAI',
                    )
                );
                $this->logger->info('FlowModelRegister', [
                    'key' => $key,
                    'model' => $key,
                    'label' => $modelEntity->getLabel(),
                    'implementation' => $modelEntity->getImplementation(),
                    'display' => $modelEntity->isDisplay(),
                ]);
            } catch (Throwable $exception) {
                $this->logger->warning('FlowModelRegisterWarning', [
                    'key' => $key,
                    'model' => $key,
                    'label' => $modelEntity->getLabel(),
                    'implementation' => $modelEntity->getImplementation(),
                    'display' => $modelEntity->isDisplay(),
                    'error' => $exception->getMessage(),
                ]);
            }
        }
    }

    /**
     * 获取当前组织下指定类型的所有可用模型.
     * @param string $organizationCode 组织代码
     * @param string $type 模型类型(chat|embedding)
     * @return OdinModel[]
     */
    private function getModelsByType(string $organizationCode, string $type): array
    {
        $list = [];

        // 获取已持久化的配置
        $models = $this->getModels($type);
        foreach ($models as $name => $model) {
            $list[$name] = new OdinModel(key: $name, model: $model, attributes: $this->attributes[$name]);
        }

        // 加载 admin 配置的所有模型
        $providerConfigs = di(ServiceProviderDomainService::class)->getActiveModelsByOrganizationCode($organizationCode, ServiceProviderCategory::LLM);
        foreach ($providerConfigs as $providerConfig) {
            if (! $providerConfig->isEnabled()) {
                continue;
            }
            foreach ($providerConfig->getModels() as $providerModel) {
                if (! $providerModel->isActive()) {
                    continue;
                }

                $model = $this->createModelByAdmin($providerConfig, $providerModel);
                $list[$model->getAttributes()->getKey()] = $model;
            }
        }

        return $list;
    }

    private function getByAdmin(string $model): ?OdinModel
    {
        $serviceProviderDomainService = di(ServiceProviderDomainService::class);
        $providerModel = $serviceProviderDomainService->getModelByIdOrVersion($model);
        if (! $providerModel) {
            return null;
        }
        if (! $providerModel->isActive()) {
            ExceptionBuilder::throw(GenericErrorCode::IllegalOperation, 'common.invalid', ['label' => $model]);
        }
        $providerConfig = $serviceProviderDomainService->getServiceProviderConfigByServiceProviderModel($providerModel);
        if (! $providerConfig || ! $providerConfig->isActive()) {
            ExceptionBuilder::throw(GenericErrorCode::IllegalOperation, 'common.invalid', ['label' => $model]);
        }
        return $this->createModelByAdmin($providerConfig, $providerModel);
    }

    private function createModelByAdmin(ServiceProviderConfigDTO|ServiceProviderConfigEntity $providerConfigEntity, ServiceProviderModelsDTO|ServiceProviderModelsEntity $providerModelsEntity): ?OdinModel
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
            return null;
        }

        return new OdinModel(
            key: $name,
            model: $this->createModel($name, [
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
            ]),
            attributes: new OdinModelAttributes(
                key: $name,
                name: $name,
                label: $providerModelsEntity->getName(),
                icon: $providerModelsEntity->getIcon(),
                tags: [['type' => 1, 'value' => $serviceProviderCode->value]],
                createdAt: new DateTime($providerModelsEntity->getCreatedAt()),
                owner: 'MagicAI',
            )
        );
    }

    private function addAttributes(string $key, OdinModelAttributes $attributes): void
    {
        $this->attributes[$key] = $attributes;
    }

    private function createModel(string $model, array $item): EmbeddingInterface|ModelInterface
    {
        $implementation = $item['implementation'] ?? '';
        if (! class_exists($implementation)) {
            throw new InvalidArgumentException(sprintf('Implementation %s is not defined.', $implementation));
        }

        // 获取全局模型配置和API配置
        $generalModelOptions = $this->config->get('odin.llm.general_model_options', []);
        $generalApiOptions = $this->config->get('odin.llm.general_api_options', []);

        // 全局配置可以被模型配置覆盖
        $modelOptionsArray = array_merge($generalModelOptions, $item['model_options'] ?? []);
        $apiOptionsArray = array_merge($generalApiOptions, $item['api_options'] ?? []);

        // 创建选项对象
        $modelOptions = new ModelOptions($modelOptionsArray);
        $apiOptions = new ApiOptions($apiOptionsArray);

        // 获取配置
        $config = $item['config'] ?? [];

        // 获取实际的端点名称，优先使用模型配置中的model字段
        $endpoint = empty($item['model']) ? $model : $item['model'];

        // 使用ModelFactory创建模型实例
        return ModelFactory::create(
            $implementation,
            $endpoint,
            $config,
            $modelOptions,
            $apiOptions,
            $this->logger
        );
    }

    private function createProxy(string $model, ModelOptions $modelOptions, ApiOptions $apiOptions): EmbeddingInterface|ModelInterface
    {
        // 使用ModelFactory创建模型实例
        return ModelFactory::create(
            MagicAILocalModel::class,
            $model,
            [
                'vector_size' => $modelOptions->getVectorSize(),
            ],
            $modelOptions,
            $apiOptions,
            $this->logger
        );
    }
}
