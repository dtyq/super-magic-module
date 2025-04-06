<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\ModelAdmin\Service;

use App\Domain\ModelAdmin\Constant\ModelType;
use App\Domain\ModelAdmin\Constant\OriginalModelType;
use App\Domain\ModelAdmin\Constant\ServiceProviderCategory;
use App\Domain\ModelAdmin\Constant\ServiceProviderCode;
use App\Domain\ModelAdmin\Constant\ServiceProviderType;
use App\Domain\ModelAdmin\Constant\Status;
use App\Domain\ModelAdmin\Entity\ServiceProviderConfigEntity;
use App\Domain\ModelAdmin\Entity\ServiceProviderEntity;
use App\Domain\ModelAdmin\Entity\ServiceProviderModelsEntity;
use App\Domain\ModelAdmin\Entity\ServiceProviderOriginalModelsEntity;
use App\Domain\ModelAdmin\Entity\ValueObject\ServiceProviderConfig;
use App\Domain\ModelAdmin\Entity\ValueObject\ServiceProviderConfigDTO;
use App\Domain\ModelAdmin\Entity\ValueObject\ServiceProviderDTO;
use App\Domain\ModelAdmin\Entity\ValueObject\ServiceProviderModelsDTO;
use App\Domain\ModelAdmin\Entity\ValueObject\ServiceProviderResponse;
use App\Domain\ModelAdmin\Factory\ServiceProviderEntityFactory;
use App\Domain\ModelAdmin\Repository\Persistence\ServiceProviderConfigRepository;
use App\Domain\ModelAdmin\Repository\Persistence\ServiceProviderModelsRepository;
use App\Domain\ModelAdmin\Repository\Persistence\ServiceProviderOriginalModelsRepository;
use App\Domain\ModelAdmin\Repository\Persistence\ServiceProviderRepository;
use App\Domain\ModelAdmin\Service\Provider\ServiceProviderFactory;
use App\ErrorCode\ServiceProviderErrorCode;
use App\Infrastructure\Core\Exception\ExceptionBuilder;
use App\Infrastructure\ExternalAPI\ImageGenerateAPI\ImageGenerateModelType;
use App\Interfaces\Kernel\Assembler\FileAssembler;
use Exception;
use Hyperf\Contract\TranslatorInterface;
use Hyperf\DbConnection\Db;
use JetBrains\PhpStorm\Deprecated;
use Psr\Log\LoggerInterface;

use function Hyperf\Translation\__;

class ServiceProviderDomainService
{
    public function __construct(
        protected ServiceProviderRepository $serviceProviderRepository,
        protected ServiceProviderModelsRepository $serviceProviderModelsRepository,
        protected ServiceProviderConfigRepository $serviceProviderConfigRepository,
        protected ServiceProviderOriginalModelsRepository $serviceProviderOriginalModelsRepository,
        protected TranslatorInterface $translator,
        protected LoggerInterface $logger,
    ) {
    }

    /**
     * 新增厂商(超级管理员用的).
     */
    public function addServiceProvider(ServiceProviderEntity $serviceProviderEntity, array $organizationCodes): ServiceProviderEntity
    {
        Db::beginTransaction();
        try {
            // todo xhy 校验 $serviceProviderEntity

            $this->serviceProviderRepository->insert($serviceProviderEntity);

            $status = ServiceProviderType::from($serviceProviderEntity->getProviderType()) === ServiceProviderType::OFFICIAL;

            // 如果是文生图，才需要同步
            if ($serviceProviderEntity->getCategory() === ServiceProviderCategory::VLM->value) {
                // 给所有组织添加厂商，同步category字段
                $this->serviceProviderConfigRepository->addServiceProviderConfigs($serviceProviderEntity->getId(), $organizationCodes, $status);
            }
            Db::commit();
        } catch (Exception $e) {
            $this->logger->error('添加厂商失败' . $e->getMessage());
            Db::rollBack();
            ExceptionBuilder::throw(ServiceProviderErrorCode::SystemError, __('service_provider.add_provider_failed'));
        }
        return $serviceProviderEntity;
    }

    /**
     * 根据id修改厂商.(超级管理员用的).
     */
    public function updateServiceProviderById(ServiceProviderEntity $serviceProviderEntity): ServiceProviderEntity
    {
        $this->serviceProviderRepository->updateById($serviceProviderEntity);

        return $serviceProviderEntity;
    }

    /**
     * 获取所有厂商.
     * @return ServiceProviderEntity[]
     */
    public function getAllServiceProvider(int $page, int $pageSize): array
    {
        return $this->serviceProviderRepository->getAll($page, $pageSize);
    }

    /**
     * 删除厂商(超级管理员用的).
     */
    public function deleteServiceProviderById(int $id)
    {
        Db::beginTransaction();
        try {
            $this->serviceProviderRepository->deleteById($id);
            $this->serviceProviderConfigRepository->deleteByServiceProviderId($id);
            // todo xhy 删除模型
        } catch (Exception $e) {
            $this->logger->error('删除厂商失败' . $e->getMessage());
            Db::rollBack();
            ExceptionBuilder::throw(ServiceProviderErrorCode::SystemError, __('service_provider.delete_provider_failed'));
        }
    }

    /**
     * 根据id获取厂商以及厂商下的模型(超级管理员用的).
     */
    public function getServiceProviderById(int $id): ?ServiceProviderDTO
    {
        $serviceProviderEntity = $this->serviceProviderRepository->getById($id);

        if ($serviceProviderEntity === null) {
            ExceptionBuilder::throw(ServiceProviderErrorCode::ServiceProviderNotFound);
        }
        $models = $this->serviceProviderModelsRepository->getModelsByServiceProviderId($serviceProviderEntity->getId());
        return ServiceProviderEntityFactory::toDTO($serviceProviderEntity, $models);
    }

    /**
     * 根据id获取厂商.
     */
    public function getServiceProviderEntityById(int $id): ?ServiceProviderEntity
    {
        $serviceProviderEntity = $this->serviceProviderRepository->getById($id);

        if ($serviceProviderEntity === null) {
            ExceptionBuilder::throw(ServiceProviderErrorCode::ServiceProviderNotFound);
        }
        return $serviceProviderEntity;
    }

    public function getServiceProviderConfigByServiceProviderModel(ServiceProviderModelsEntity $serviceProviderModelsEntity): ?ServiceProviderConfigEntity
    {
        // 获取厂商配置
        $serviceProviderConfigEntity = $this->serviceProviderConfigRepository->getById($serviceProviderModelsEntity->getServiceProviderConfigId());
        if (! $serviceProviderConfigEntity) {
            ExceptionBuilder::throw(ServiceProviderErrorCode::ServiceProviderConfigError);
        }
        // 获取服务商配置，用于确定使用 odin 的哪个客户端去连
        $serviceProviderEntity = $this->serviceProviderRepository->getById($serviceProviderConfigEntity->getServiceProviderId());
        if (! $serviceProviderEntity) {
            ExceptionBuilder::throw(ServiceProviderErrorCode::ServiceProviderNotFound);
        }
        $serviceProviderConfigEntity->setProviderCode(ServiceProviderCode::tryFrom($serviceProviderEntity->getProviderCode()));
        // todo 管理后台未适配官方服务商，只能返回 null 然后走 model-config 的配置，待解决
        if ($serviceProviderEntity->getProviderType() === ServiceProviderType::OFFICIAL->value) {
            return null;
        }
        return $serviceProviderConfigEntity;
    }

    public function addModelToServiceProviderByOrg(ServiceProviderModelsEntity $serviceProviderModelsEntity): ServiceProviderModelsEntity
    {
        $serviceProviderModelsEntity->valid();

        return $serviceProviderModelsEntity;
    }

    /**
     * 给 llm 服务商添加模型，组织自行添加.
     */
    public function saveModelsToServiceProvider(ServiceProviderModelsEntity $serviceProviderModelsEntity): ServiceProviderModelsEntity
    {
        $serviceProviderModelsEntity->valid();

        $serviceProviderConfigEntity = $this->serviceProviderConfigRepository->getByIdAndOrganizationCode(
            (string) $serviceProviderModelsEntity->getServiceProviderConfigId(),
            $serviceProviderModelsEntity->getOrganizationCode()
        );

        $serviceProviderEntity = $this->serviceProviderRepository->getById($serviceProviderConfigEntity->getServiceProviderId());

        if (! $serviceProviderEntity) {
            ExceptionBuilder::throw(ServiceProviderErrorCode::ServiceProviderNotFound);
        }
        $serviceProviderModelsEntity->setIcon(FileAssembler::formatPath($serviceProviderModelsEntity->getIcon()));

        $serviceProviderModelsEntity->setCategory($serviceProviderEntity->getCategory());
        $serviceProviderModelsEntity->valid();

        // 校验model_id
        if (! $this->serviceProviderOriginalModelsRepository->exist($serviceProviderModelsEntity->getModelId())) {
            ExceptionBuilder::throw(ServiceProviderErrorCode::InvalidParameter, '模型id不存在');
        }

        // 是否是官方服务商
        $isOfficialProvider = ServiceProviderType::from($serviceProviderEntity->getProviderType()) === ServiceProviderType::OFFICIAL;

        if ($isOfficialProvider || ServiceProviderCategory::from($serviceProviderEntity->getCategory()) === ServiceProviderCategory::VLM) {
            ExceptionBuilder::throw(ServiceProviderErrorCode::InvalidParameter);
        }
        $this->serviceProviderModelsRepository->saveModels($serviceProviderModelsEntity);

        return $serviceProviderModelsEntity;
    }

    public function saveModelsToServiceProviderForAdmin(ServiceProviderModelsEntity $serviceProviderModelsEntity): ServiceProviderModelsEntity
    {
        $serviceProviderModelsEntity->valid();

        $serviceProviderConfigEntity = $this->serviceProviderConfigRepository->getByIdAndOrganizationCode(
            (string) $serviceProviderModelsEntity->getServiceProviderConfigId(),
            $serviceProviderModelsEntity->getOrganizationCode()
        );

        $serviceProviderModelsEntity->setIcon(FileAssembler::formatPath($serviceProviderModelsEntity->getIcon()));

        $serviceProviderEntity = $this->serviceProviderRepository->getById($serviceProviderConfigEntity->getServiceProviderId());

        // 校验model_id
        if ($serviceProviderEntity->getCategory() === ServiceProviderCategory::LLM->value && ! $this->serviceProviderOriginalModelsRepository->exist($serviceProviderModelsEntity->getModelId())) {
            ExceptionBuilder::throw(ServiceProviderErrorCode::InvalidParameter, '模型id不存在');
        }

        if (! $serviceProviderEntity) {
            ExceptionBuilder::throw(ServiceProviderErrorCode::ServiceProviderNotFound);
        }

        $serviceProviderModelsEntity->setCategory($serviceProviderEntity->getCategory());
        $serviceProviderModelsEntity->valid();
        $this->handleNonOfficialProviderModel($serviceProviderModelsEntity, $serviceProviderEntity);
        return $serviceProviderModelsEntity;
    }

    /**
     * 根据组织获取厂商.
     * @return ServiceProviderConfigDTO[]
     */
    public function getServiceProviderConfigs(string $organization, ?ServiceProviderCategory $serviceProviderCategory = null): array
    {
        $serviceProviderConfigEntities = $this->serviceProviderConfigRepository->getByOrganizationCode($organization);

        // 获取id
        $ids = array_column($serviceProviderConfigEntities, 'service_provider_id');
        $serviceProviderEntities = $this->serviceProviderRepository->getByIds($ids);
        $serviceProviderMap = [];
        foreach ($serviceProviderEntities as $serviceProviderEntity) {
            $serviceProviderMap[$serviceProviderEntity->getId()] = $serviceProviderEntity;
        }
        $result = [];
        foreach ($serviceProviderConfigEntities as $serviceProviderConfigEntity) {
            $serviceProviderEntity = $serviceProviderMap[$serviceProviderConfigEntity->getServiceProviderId()];
            if ($serviceProviderCategory === null || $serviceProviderEntity->getCategory() === $serviceProviderCategory->value) {
                $result[] = $this->buildServiceProviderConfigDTO($serviceProviderEntity, $serviceProviderConfigEntity);
            }
        }

        return $result;
    }

    /**
     * 获取厂商配置信息.
     */
    public function getServiceProviderConfigDetail(string $serviceProviderConfigId, string $organizationCode): ServiceProviderConfigDTO
    {
        $serviceProviderConfigEntity = $this->serviceProviderConfigRepository->getByIdAndOrganizationCode($serviceProviderConfigId, $organizationCode);
        $serviceProviderEntities = $this->serviceProviderRepository->getByIds([$serviceProviderConfigEntity->getServiceProviderId()]);

        // 可能这个厂商官方下架了
        if (empty($serviceProviderEntities)) {
            ExceptionBuilder::throw(ServiceProviderErrorCode::ServiceProviderNotFound);
        }

        // 获取组织级别的模型
        $models = $this->getModelStatusByServiceProviderConfigIdAndOrganizationCode($serviceProviderConfigId, $organizationCode);
        return $this->buildServiceProviderConfigDTO($serviceProviderEntities[0], $serviceProviderConfigEntity, $models);
    }

    /**
     * @return ServiceProviderModelsDTO[]
     */
    public function getModelStatusByServiceProviderConfigIdAndOrganizationCode(string $serviceProviderConfigId, string $organizationCode): array
    {
        $serviceProviderModelsEntities = $this->serviceProviderModelsRepository->getModelStatusByServiceProviderConfigIdAndOrganizationCode($serviceProviderConfigId, $organizationCode);

        $serviceProviderModelsDTOs = [];
        foreach ($serviceProviderModelsEntities as $serviceProviderModelsEntity) {
            $serviceProviderModelsDTOs[] = new ServiceProviderModelsDTO($serviceProviderModelsEntity->toArray());
        }

        return $serviceProviderModelsDTOs;
    }

    /**
     * 保存厂商配置信息.
     */
    public function updateServiceProviderConfig(ServiceProviderConfigEntity $serviceProviderConfigEntity): ServiceProviderConfigEntity
    {
        $serviceProviderConfigEntityObject = $this->serviceProviderConfigRepository->getByIdAndOrganizationCode((string) $serviceProviderConfigEntity->getId(), $serviceProviderConfigEntity->getOrganizationCode());

        // 不可修改官方服务商
        $serviceProviderEntity = $this->serviceProviderRepository->getById($serviceProviderConfigEntityObject->getServiceProviderId());

        if (! $serviceProviderEntity) {
            ExceptionBuilder::throw(ServiceProviderErrorCode::ServiceProviderNotFound);
        }

        if (ServiceProviderType::from($serviceProviderEntity->getProviderType()) === ServiceProviderType::OFFICIAL) {
            ExceptionBuilder::throw(ServiceProviderErrorCode::SystemError, '官方服务商不可修改');
        }

        // 处理脱敏后的配置数据
        if ($serviceProviderConfigEntity->getConfig() && $serviceProviderConfigEntityObject->getConfig()) {
            $processedConfig = $this->processDesensitizedConfig(
                $serviceProviderConfigEntity->getConfig(),
                $serviceProviderConfigEntityObject->getConfig()
            );
            $serviceProviderConfigEntity->setConfig($processedConfig);
        }

        $serviceProviderConfigEntity->setServiceProviderId($serviceProviderConfigEntityObject->getServiceProviderId());

        // 只有大模型服务商并且是非官方的类型才能修改别名
        if (ServiceProviderCategory::from($serviceProviderEntity->getCategory()) === ServiceProviderCategory::VLM) {
            $serviceProviderConfigEntity->setAlias('');
        }

        $this->serviceProviderConfigRepository->save($serviceProviderConfigEntity);
        return $serviceProviderConfigEntity;
    }

    /**
     * 修改可用的模型状态
     */
    public function updateModelStatus(string $modelId, Status $status, string $organizationCode)
    {
        $this->serviceProviderModelsRepository->updateModelStatus($modelId, $organizationCode, $status);
    }

    /**
     * 刷新模型列表
     * 根据当前的厂商进行.
     */
    public function refreshModels(string $serviceProviderConfigId, string $organizationCode): array
    {
        $serviceProviderConfigDetail = $this->getServiceProviderConfigDetail($serviceProviderConfigId, $organizationCode);
        if (! $serviceProviderConfigDetail->getIsModelsEnable()) {
            ExceptionBuilder::throw(ServiceProviderErrorCode::SystemError, __('service_provider.provider_no_model_list'));
        }

        return [];
    }

    /**
     * 刷新模型列表的接口，因需求的调整，该功能废弃，但不排除未来要用到，这个接口破坏性大，防止调用，注释掉代码
     */
    #[Deprecated]
    public function refreshModelsForAdmin(string $serviceProviderId)
    {
        //        $serviceProviderEntity = $this->serviceProviderRepository->getById((int)$serviceProviderId);
        //        if (!$serviceProviderEntity) {
        //            ExceptionBuilder::throw(ServiceProviderErrorCode::ServiceProviderNotFound);
        //        }
        //        $serviceProviderCode = ServiceProviderCode::from($serviceProviderEntity->getProviderCode());
        //        $models = ServiceProviderFactory::get($serviceProviderCode)->getModels($serviceProviderEntity);
        //
        //        // 对比 modelVersion 转为map
        //        $modelVersionMap = [];
        //        foreach ($models as $model) {
        //            $modelVersionMap[$model->getModelVersion()] = $model;
        //        }
        //
        //        // 获取该服务商下的所有模型
        //        $serviceProviderModelsEntities = $this->serviceProviderModelsRepository->getByProviderId($serviceProviderEntity->getId());
        //
        //        $serviceProviderModelsMap = [];
        //        foreach ($serviceProviderModelsEntities as $serviceProviderModelsEntity) {
        //            $serviceProviderModelsMap[$serviceProviderModelsEntity->getModelVersion()] = $serviceProviderModelsEntity;
        //        }
        //
        //        // 新增模型： $models 中有， $serviceProviderModelsEntities 没有的
        //        $addModels = [];
        //        foreach ($models as $model) {
        //            if (!isset($serviceProviderModelsMap[$model->getModelVersion()])) {
        //                $addModels[] = $model;
        //            }
        //        }
        //
        //        // 删除模型： $models 中没有，$serviceProviderModelsEntities 中有的
        //        $deleteModels = [];
        //        foreach ($serviceProviderModelsEntities as $serviceProviderModelsEntity) {
        //            if (!isset($modelVersionMap[$serviceProviderModelsEntity->getModelVersion()])) {
        //                $deleteModels[] = $serviceProviderModelsEntity;
        //            }
        //        }
        //        // 新增模型
        //        $this->addModelsToServiceProvider($addModels, (int)$serviceProviderId);
        //        // 删除模型
        //        $this->deleteModelsToServiceProvider($deleteModels);
    }

    /**
     * 是否激活并且返回服务商以及模型信息.
     */
    public function isActivatedAndReturnServiceProviderAndModelConfig(string $modelId): ServiceProviderResponse
    {
        $serviceProviderModelStatusEntity = $this->serviceProviderModelsRepository->getById($modelId);
        if (Status::from($serviceProviderModelStatusEntity->getStatus()) === Status::DISABLE) {
            ExceptionBuilder::throw(ServiceProviderErrorCode::ModelNotActive);
        }

        $serviceProviderConfigId = $serviceProviderModelStatusEntity->getServiceProviderConfigId();
        $serviceProviderConfigEntity = $this->serviceProviderConfigRepository->getByIdAndOrganizationCode((string) $serviceProviderConfigId, $serviceProviderModelStatusEntity->getOrganizationCode());
        if (Status::from($serviceProviderConfigEntity->getStatus()) === Status::DISABLE) {
            ExceptionBuilder::throw(ServiceProviderErrorCode::ServiceProviderNotActive);
        }

        // 查询模型
        $modelEntity = $this->serviceProviderModelsRepository->getByIds([$serviceProviderModelStatusEntity->getModelId()])[0];

        $serviceProviderId = $serviceProviderConfigEntity->getServiceProviderId();
        $serviceProviderEntity = $this->serviceProviderRepository->getById($serviceProviderId);
        $serviceProviderResponse = new ServiceProviderResponse();
        $serviceProviderResponse->setModelConfig($modelEntity->getConfig());
        $serviceProviderResponse->setServiceProviderConfig($serviceProviderConfigEntity->getConfig());
        $serviceProviderResponse->setServiceProviderType(ServiceProviderType::from($serviceProviderEntity->getProviderType()));
        return $serviceProviderResponse;
    }

    /**
     * 根据组织和厂商类型获取模型列表.
     * @param string $organizationCode 组织编码
     * @param ServiceProviderCategory $serviceProviderCategory 厂商类型
     * @return ServiceProviderConfigDTO[]
     */
    public function getActiveModelsByOrganizationCode(string $organizationCode, ?ServiceProviderCategory $serviceProviderCategory = null): array
    {
        // 1. 获取组织下的所有厂商配置
        $serviceProviderConfigs = $this->serviceProviderConfigRepository->getByOrganizationCodeAndActive($organizationCode);
        if (empty($serviceProviderConfigs)) {
            return [];
        }

        // 2. 获取对应的厂商信息
        $serviceProviderIds = array_column($serviceProviderConfigs, 'service_provider_id');
        $serviceProviderEntities = $this->serviceProviderRepository->getByIds($serviceProviderIds);

        // 按类型过滤厂商
        $serviceProviderMap = [];
        foreach ($serviceProviderEntities as $serviceProviderEntity) {
            if ($serviceProviderCategory === null || $serviceProviderEntity->getCategory() === $serviceProviderCategory->value) {
                $serviceProviderMap[$serviceProviderEntity->getId()] = $serviceProviderEntity;
            }
        }

        if (empty($serviceProviderMap)) {
            return [];
        }

        // 过滤掉不符合类型的配置
        /**
         * @var ServiceProviderConfigEntity[] $filteredConfigEntities
         */
        $filteredConfigEntities = [];
        foreach ($serviceProviderConfigs as $configEntity) {
            if (isset($serviceProviderMap[$configEntity->getServiceProviderId()])) {
                $filteredConfigEntities[] = $configEntity;
            }
        }

        // 3. 获取所有配置的激活模型
        $serviceProviderConfigIds = array_column($filteredConfigEntities, 'id');
        $allActiveModels = $this->serviceProviderModelsRepository->getActiveModelsByOrganizationCode($serviceProviderConfigIds, $organizationCode);

        if (empty($allActiveModels)) {
            return [];
        }

        // 4. 按照service_provider_config_id分组active models
        $activeModelsMap = [];
        foreach ($allActiveModels as $activeModel) {
            $configId = $activeModel->getServiceProviderConfigId();
            if (! isset($activeModelsMap[$configId])) {
                $activeModelsMap[$configId] = [];
            }
            $activeModelsMap[$configId][] = $activeModel;
        }

        // 5. 组装结果
        $result = [];
        foreach ($filteredConfigEntities as $configEntity) {
            $serviceProviderId = $configEntity->getServiceProviderId();
            $configId = $configEntity->getId();
            $activeModels = $activeModelsMap[$configId] ?? [];

            // 直接使用 activeModels 创建 DTO
            $configModels = [];
            foreach ($activeModels as $model) {
                $configModels[] = new ServiceProviderModelsDTO($model->toArray());
            }

            $serviceProviderConfigDTO = $this->buildServiceProviderConfigDTO($serviceProviderMap[$serviceProviderId], $configEntity, $configModels);
            $serviceProviderConfigDTO->setConfig(new ServiceProviderConfig());
            $result[] = $serviceProviderConfigDTO;
        }

        return $result;
    }

    public function deleteModel(string $modelId, string $organizationCode)
    {
        // 如果是 llm 则只删除自己的服务商下面的模型
        // 如果是 vlm 则所有服务商的模型都要删除 （因为该模型的添加是同步添加，删除也要同步删除）
        $serviceProviderModelsEntity = $this->serviceProviderModelsRepository->getById($modelId);
        $serviceProviderConfigEntity = $this->serviceProviderConfigRepository->getByIdAndOrganizationCode((string) $serviceProviderModelsEntity->getServiceProviderConfigId(), $serviceProviderModelsEntity->getOrganizationCode());
        $serviceProviderEntity = $this->serviceProviderRepository->getById($serviceProviderConfigEntity->getServiceProviderId());
        if (ServiceProviderCategory::from($serviceProviderEntity->getCategory()) === ServiceProviderCategory::VLM || ServiceProviderType::from($serviceProviderEntity->getProviderType()) === ServiceProviderType::OFFICIAL) {
            // 通过 service_provider_config_ids 和 model_version 进行删除
            $serviceProviderConfigEntities = $this->serviceProviderConfigRepository->getsByServiceProviderId($serviceProviderEntity->getId());
            $serviceProviderConfigIds = array_column($serviceProviderConfigEntities, 'id');
            $this->serviceProviderModelsRepository->deleteByServiceProviderConfigIdsAndModelVersion($serviceProviderConfigIds, $serviceProviderModelsEntity->getModelVersion());
        } else {
            $this->serviceProviderModelsRepository->deleteByModelIdAndOrganizationCode($modelId, $organizationCode);
        }
    }

    /**
     * 获取原始模型列表.
     * @return ServiceProviderOriginalModelsEntity[]
     */
    public function listOriginalModels(string $organizationCode): array
    {
        // 获取系统的模型标识
        return $this->serviceProviderOriginalModelsRepository->listModels($organizationCode);
    }

    /**
     * 初始化组织的服务商信息
     * 当新加入一个组织后，初始化该组织的服务商和模型配置.
     * @return ServiceProviderConfigDTO[] 初始化后的服务商配置列表
     */
    public function initOrganizationServiceProviders(string $organizationCode, ?ServiceProviderCategory $serviceProviderCategory = null): array
    {
        $result = [];
        Db::beginTransaction();
        try {
            // 获取所有服务商（如果指定了类别，则只获取该类别的服务商）
            $serviceProviders = $this->serviceProviderRepository->getAllByCategory(1, 1000, $serviceProviderCategory);
            if (empty($serviceProviders)) {
                return [];
            }

            // 收集需要同步模型的服务商（官方和VLM类型）
            $officialAndVlmProviders = [];
            $serviceProviderMap = [];

            foreach ($serviceProviders as $serviceProvider) {
                $serviceProviderMap[$serviceProvider->getId()] = $serviceProvider;
                // 收集需要同步模型的服务商（官方和VLM类型）
                $isOfficial = ServiceProviderType::from($serviceProvider->getProviderType()) === ServiceProviderType::OFFICIAL;
                if ($isOfficial || ServiceProviderCategory::from($serviceProvider->getCategory()) === ServiceProviderCategory::VLM) {
                    $officialAndVlmProviders[] = $serviceProvider->getId();
                }
            }

            // 批量创建服务商配置
            $configEntities = $this->batchCreateServiceProviderConfigs($serviceProviders, $organizationCode);

            // 如果有官方或VLM服务商，批量同步它们的模型
            if (! empty($officialAndVlmProviders)) {
                $this->batchSyncServiceProviderModels($officialAndVlmProviders, $organizationCode);
            }

            // 构建返回结果
            foreach ($configEntities as $configEntity) {
                $serviceProviderId = $configEntity->getServiceProviderId();
                if (isset($serviceProviderMap[$serviceProviderId])) {
                    $result[] = $this->buildServiceProviderConfigDTO(
                        $serviceProviderMap[$serviceProviderId],
                        $configEntity
                    );
                }
            }

            Db::commit();
        } catch (Exception $e) {
            $this->logger->error('初始化组织服务商失败: ' . $e->getMessage());
            Db::rollBack();
            ExceptionBuilder::throw(ServiceProviderErrorCode::SystemError, __('service_provider.init_organization_providers_failed'));
        }

        return $result;
    }

    /**
     * 批量同步服务商模型数据.
     * @param array $serviceProviderIds 服务商ID数组
     * @param string $orgCode 组织代码
     */
    public function batchSyncServiceProviderModels(array $serviceProviderIds, string $orgCode): bool
    {
        if (empty($serviceProviderIds) || empty($orgCode)) {
            return false;
        }

        // 1. 获取目标组织下的所有服务商配置
        $newOrgConfigs = $this->serviceProviderConfigRepository->getByOrganizationCode($orgCode);
        if (empty($newOrgConfigs)) {
            return false;
        }

        // 2. 创建服务商ID到配置ID的映射
        $newOrgConfigMap = [];
        foreach ($newOrgConfigs as $config) {
            $newOrgConfigMap[$config->getServiceProviderId()] = $config->getId();
        }

        // 3. 获取样例配置ID和对应的服务商ID映射
        $configToProviderMap = $this->serviceProviderConfigRepository->getSampleConfigsByServiceProviderIds($serviceProviderIds);
        if (empty($configToProviderMap)) {
            return true; // 没有找到任何配置，但不视为错误
        }

        // 4. 获取所有样例配置ID
        $sampleConfigIds = array_keys($configToProviderMap);

        // 5. 根据样例配置ID批量获取模型
        $allModels = $this->serviceProviderModelsRepository->getModelsByConfigIds($sampleConfigIds);
        if (empty($allModels)) {
            return true;
        }

        // 6. 按服务商ID组织模型
        $modelsByProviderId = [];
        foreach ($allModels as $model) {
            $configId = $model->getServiceProviderConfigId();
            if (isset($configToProviderMap[$configId])) {
                $providerId = $configToProviderMap[$configId];
                if (! isset($modelsByProviderId[$providerId])) {
                    $modelsByProviderId[$providerId] = [];
                }
                $modelsByProviderId[$providerId][] = $model;
            }
        }

        // 7. 为目标组织创建模型副本
        $modelsToSave = [];
        foreach ($serviceProviderIds as $serviceProviderId) {
            if (! isset($newOrgConfigMap[$serviceProviderId]) || ! isset($modelsByProviderId[$serviceProviderId])) {
                continue;
            }

            $newConfigId = $newOrgConfigMap[$serviceProviderId];
            $baseModels = $modelsByProviderId[$serviceProviderId];

            foreach ($baseModels as $baseModel) {
                $newModel = clone $baseModel;
                $newModel->setServiceProviderConfigId($newConfigId);
                $newModel->setOrganizationCode($orgCode);
                $modelsToSave[] = $newModel;
            }
        }

        // 8. 批量保存所有模型
        if (! empty($modelsToSave)) {
            $this->serviceProviderModelsRepository->batchSaveModels($modelsToSave);
            return true;
        }

        return true;
    }

    /**
     * 连通性测试.
     */
    public function connectivityTest(string $serviceProviderConfigId, string $modelVersion, string $organizationCode)
    {
        $serviceProviderConfigDTO = $this->getServiceProviderConfigDetail($serviceProviderConfigId, $organizationCode);
        $serviceProviderConfig = $serviceProviderConfigDTO->getConfig();

        $serviceProviderCode = ServiceProviderCode::from($serviceProviderConfigDTO->getProviderCode());

        $provider = ServiceProviderFactory::get($serviceProviderCode, ServiceProviderCategory::from($serviceProviderConfigDTO->getCategory()));
        return $provider->connectivityTestByModel($serviceProviderConfig, $modelVersion);
    }

    public function syncModelsToServiceProvider(ServiceProviderModelsEntity $serviceProviderModelsEntity)
    {
        // 验证模型实体
        $serviceProviderModelsEntity->valid();

        // 获取服务提供商配置
        $serviceProviderConfigEntities = $this->serviceProviderConfigRepository->getsByServiceProviderId($serviceProviderModelsEntity->getServiceProviderConfigId());

        if (empty($serviceProviderConfigEntities)) {
            ExceptionBuilder::throw(ServiceProviderErrorCode::ServiceProviderNotFound);
        }

        $modelArray = $serviceProviderModelsEntity->toArray();
        // 为每个组织添加模型
        foreach ($serviceProviderConfigEntities as $serviceProviderConfigEntity) {
            $organizationCode = $serviceProviderConfigEntity->getOrganizationCode();

            $modelEntity = new ServiceProviderModelsEntity($modelArray);
            $modelEntity->setOrganizationCode($organizationCode);
        }
    }

    public function addOriginalModel(string $modelId)
    {
        if ($this->serviceProviderOriginalModelsRepository->exist($modelId)) {
            ExceptionBuilder::throw(ServiceProviderErrorCode::InvalidParameter, __('service_provider.original_model_already_exists'));
        }

        $serviceProviderOriginalModelsEntity = new ServiceProviderOriginalModelsEntity();
        $serviceProviderOriginalModelsEntity->setModelId($modelId);
        $this->serviceProviderOriginalModelsRepository->insert($serviceProviderOriginalModelsEntity);
    }

    public function deleteOriginalModel(string $modelId)
    {
        $this->serviceProviderOriginalModelsRepository->deleteByModelId($modelId);
    }

    /**
     * 获取服务商配置（综合方法）
     * 根据模型版本、模型ID和组织编码获取服务商配置.
     *
     * @param string $modelVersion 模型版本
     * @param string $modelId 模型ID
     * @param string $organizationCode 组织编码
     * @return ServiceProviderResponse 服务商配置响应
     */
    public function getServiceProviderConfig(
        string $modelVersion,
        string $modelId,
        string $organizationCode,
        bool $throw = true,
    ): ?ServiceProviderResponse {
        // 1. 如果提供了 modelId，走新的逻辑
        if (! empty($modelId)) {
            return $this->getServiceProviderConfigByModelId($modelId, $organizationCode, $throw);
        }

        // 2. 如果只有 modelVersion，先尝试查找对应的模型
        if (! empty($modelVersion)) {
            $models = $this->serviceProviderModelsRepository->getModelsByVersionAndOrganization($modelVersion, $organizationCode);
            if (! empty($models)) {
                // 如果找到模型，不直接返回官方服务商配置，而是进行进一步判断
                $this->logger->info('找到对应模型，判断服务商配置', [
                    'modelVersion' => $modelVersion,
                    'organizationCode' => $organizationCode,
                ]);

                // 从激活的模型中查找可用的服务商配置
                return $this->findAvailableServiceProviderFromModels($models, $organizationCode);
            }

            // 如果是预定义的模型类型，返回官方服务商配置
            $allImageModels = array_merge(
                ImageGenerateModelType::getMidjourneyModes(),
                ImageGenerateModelType::getFluxModes(),
                ImageGenerateModelType::getVolcengineModes(),
            );

            if (in_array($modelVersion, $allImageModels)) {
                $this->logger->info('使用预定义模型，返回官方服务商配置', [
                    'modelVersion' => $modelVersion,
                    'organizationCode' => $organizationCode,
                ]);
                $serviceProviderResponse = new ServiceProviderResponse();
                $serviceProviderResponse->setServiceProviderType(ServiceProviderType::OFFICIAL);
                return $serviceProviderResponse;
            }
            return null;
        }

        // 3. 如果都没找到，抛出异常
        ExceptionBuilder::throw(ServiceProviderErrorCode::ModelNotFound);
    }

    /**
     * 根据模型ID获取服务商配置.
     * @param string $modelId 模型ID
     * @param string $organizationCode 组织编码
     * @throws Exception
     */
    public function getServiceProviderConfigByModelId(string $modelId, string $organizationCode, bool $throwModelNotExist = true): ?ServiceProviderResponse
    {
        // 1. 获取模型信息
        $serviceProviderModelEntity = $this->serviceProviderModelsRepository->getById($modelId, $throwModelNotExist);

        if (empty($serviceProviderModelEntity)) {
            return null;
        }

        // 2. 检查模型状态
        if (Status::from($serviceProviderModelEntity->getStatus()) === Status::DISABLE) {
            ExceptionBuilder::throw(ServiceProviderErrorCode::ModelNotActive);
        }

        // 3. 获取服务商配置
        $serviceProviderConfigId = $serviceProviderModelEntity->getServiceProviderConfigId();
        $serviceProviderConfigEntity = $this->serviceProviderConfigRepository->getByIdAndOrganizationCode(
            (string) $serviceProviderConfigId,
            $organizationCode
        );

        // 4. 获取服务商信息
        $serviceProviderId = $serviceProviderConfigEntity->getServiceProviderId();
        $serviceProviderEntity = $this->serviceProviderRepository->getById($serviceProviderId);
        if (! $serviceProviderEntity) {
            ExceptionBuilder::throw(ServiceProviderErrorCode::ServiceProviderNotFound);
        }

        // 5. 判断服务商类型和状态
        $serviceProviderType = ServiceProviderType::from($serviceProviderEntity->getProviderType());
        if (
            $serviceProviderType !== ServiceProviderType::OFFICIAL
            && Status::from($serviceProviderConfigEntity->getStatus()) === Status::DISABLE
        ) {
            ExceptionBuilder::throw(ServiceProviderErrorCode::ServiceProviderNotActive);
        }

        // 6. 构建响应
        $serviceProviderResponse = new ServiceProviderResponse();
        $serviceProviderResponse->setModelConfig($serviceProviderModelEntity->getConfig());
        $serviceProviderResponse->setServiceProviderConfig($serviceProviderConfigEntity->getConfig());
        $serviceProviderResponse->setServiceProviderType($serviceProviderType);
        $serviceProviderResponse->setServiceProviderModelsEntity($serviceProviderModelEntity);
        $serviceProviderResponse->setServiceProviderCode($serviceProviderEntity->getProviderCode());

        return $serviceProviderResponse;
    }

    /**
     * 根据多个ID批量获取服务商配置.
     *
     * @param array $ids 服务商配置ID数组
     * @return ServiceProviderConfigEntity[] 服务商配置实体数组
     */
    public function getServiceProviderConfigsByIds(array $ids): array
    {
        if (empty($ids)) {
            return [];
        }

        return $this->serviceProviderConfigRepository->getByIds($ids);
    }

    /**
     * 构建服务商配置DTO.
     * @param ServiceProviderEntity $serviceProviderEntity 服务商实体
     * @param ServiceProviderConfigEntity $serviceProviderConfigEntity 服务商配置实体
     * @param array $model 模型列表
     * @return ServiceProviderConfigDTO 服务商配置DTO
     */
    public function buildServiceProviderConfigDTO(ServiceProviderEntity $serviceProviderEntity, ServiceProviderConfigEntity $serviceProviderConfigEntity, array $model = []): ServiceProviderConfigDTO
    {
        $data = array_merge($serviceProviderConfigEntity->toArray(), $serviceProviderEntity->toArray());

        $serviceProviderConfigDTO = new ServiceProviderConfigDTO($data);
        $serviceProviderConfigDTO->setModels($model);
        $serviceProviderConfigDTO->setId($serviceProviderConfigEntity->getId());
        $serviceProviderConfigDTO->setStatus($serviceProviderConfigEntity->getStatus());
        return $serviceProviderConfigDTO;
    }

    public function getModelByIdAndOrganizationCode(string $modelId, string $organizationCode): ServiceProviderModelsEntity
    {
        return $this->serviceProviderModelsRepository->getModelByIdAndOrganizationCode($modelId, $organizationCode);
    }

    public function getModelById(string $id): ServiceProviderModelsEntity
    {
        return $this->serviceProviderModelsRepository->getById($id);
    }

    public function deleteServiceProviderForAdmin(string $serviceProviderConfigId, string $organizationCode)
    {
        Db::beginTransaction();
        try {
            // 1. 获取服务商配置实体
            $serviceProviderConfigEntity = $this->serviceProviderConfigRepository->getByIdAndOrganizationCode($serviceProviderConfigId, $organizationCode);
            $serviceProviderId = $serviceProviderConfigEntity->getServiceProviderId();

            // 2. 获取所有相关的服务商配置
            $serviceProviderConfigEntities = $this->serviceProviderConfigRepository->getsByServiceProviderId($serviceProviderId);
            $serviceProviderConfigIds = array_column($serviceProviderConfigEntities, 'id');

            // 3. 获取并删除服务商配置下的所有模型
            if (! empty($serviceProviderConfigIds)) {
                // 获取与这些配置相关的所有模型
                $models = $this->serviceProviderModelsRepository->getModelsByServiceProviderConfigIds($serviceProviderConfigIds);

                if (! empty($models)) {
                    // 提取模型 ID 列表
                    $modelIds = array_map(function ($model) {
                        return $model->getId();
                    }, $models);
                    $this->serviceProviderModelsRepository->deleteByIds($modelIds);
                }
            }

            // 4. 删除服务商配置
            $this->serviceProviderConfigRepository->deleteByServiceProviderId($serviceProviderId);

            Db::commit();
        } catch (Exception $e) {
            $this->logger->error('删除服务商及模型失败: ' . $e->getMessage());
            Db::rollBack();
            ExceptionBuilder::throw(ServiceProviderErrorCode::SystemError, __('service_provider.delete_provider_failed'));
        }
    }

    public function updateServiceProvider(ServiceProviderEntity $serviceProviderEntity, string $organizationCode): ServiceProviderEntity
    {
        $serviceProviderEntity->setIcon(FileAssembler::formatPath($serviceProviderEntity->getIcon()));
        $serviceProviderConfigEntity = $this->serviceProviderConfigRepository->getByIdAndOrganizationCode((string) $serviceProviderEntity->getId(), $organizationCode);
        $serviceProviderId = $serviceProviderConfigEntity->getServiceProviderId();
        $serviceProviderEntity->setId($serviceProviderId);
        return $this->serviceProviderRepository->updateById($serviceProviderEntity);
    }

    public function addModelId(string $modelId): ServiceProviderOriginalModelsEntity
    {
        $serviceProviderOriginalModelsEntity = new ServiceProviderOriginalModelsEntity();
        $serviceProviderOriginalModelsEntity->setModelId($modelId);
        return $this->serviceProviderOriginalModelsRepository->insert($serviceProviderOriginalModelsEntity);
    }

    public function addServiceProviderForOrganization(ServiceProviderConfigDTO $serviceProviderConfigDTO, string $organizationCode): ServiceProviderConfigDTO
    {
        $serviceProviderId = (int) $serviceProviderConfigDTO->getServiceProviderId();
        // 获取服务商
        $serviceProviderEntity = $this->serviceProviderRepository->getById($serviceProviderId);
        if (! $serviceProviderEntity) {
            ExceptionBuilder::throw(ServiceProviderErrorCode::ServiceProviderNotFound);
        }

        // 如果是官方服务商则不允许添加
        $serviceProviderType = ServiceProviderType::from($serviceProviderEntity->getProviderType());
        if ($serviceProviderType === ServiceProviderType::OFFICIAL) {
            ExceptionBuilder::throw(ServiceProviderErrorCode::ServiceProviderNotFound);
        }

        // 添加事务
        Db::beginTransaction();
        try {
            $serviceProviderConfigEntity = new ServiceProviderConfigEntity();
            $serviceProviderConfigEntity->setAlias($serviceProviderConfigDTO->getAlias());
            $serviceProviderConfigEntity->setServiceProviderId($serviceProviderEntity->getId());
            $serviceProviderConfigEntity->setOrganizationCode($organizationCode);
            $serviceProviderConfigEntity->setStatus($serviceProviderConfigDTO->getStatus());
            $serviceProviderConfigEntity->setConfig(new ServiceProviderConfig());
            $serviceProviderConfigEntity = $this->serviceProviderConfigRepository->insert($serviceProviderConfigEntity);
        } catch (Exception $exception) {
            Db::rollBack();
            $this->logger->error('添加服务商失败: ' . $exception->getMessage());
            ExceptionBuilder::throw(ServiceProviderErrorCode::SystemError, __('service_provider.add_provider_failed'));
        }
        Db::commit();
        return $this->buildServiceProviderConfigDTO($serviceProviderEntity, $serviceProviderConfigEntity);
    }

    public function deleteServiceProviderForOrganization(string $serviceProviderConfigId, string $organizationCode): void
    {
        // 判断 serviceProviderConfigId 为空
        if (empty($serviceProviderConfigId)) {
            ExceptionBuilder::throw(ServiceProviderErrorCode::InvalidParameter, __('service_provider.service_provider_config_id_is_required'));
        }

        // 查询服务商配置
        $serviceProviderConfigEntity = $this->serviceProviderConfigRepository->getByIdAndOrganizationCode($serviceProviderConfigId, $organizationCode);

        // 查询服务商
        $serviceProviderEntity = $this->serviceProviderRepository->getById($serviceProviderConfigEntity->getServiceProviderId());
        if (! $serviceProviderEntity) {
            ExceptionBuilder::throw(ServiceProviderErrorCode::ServiceProviderNotFound);
        }

        // 只有大模型的服务商并且是非官方的服务商才能删除
        $serviceProviderType = ServiceProviderType::from($serviceProviderEntity->getProviderType());
        if ($serviceProviderType === ServiceProviderType::OFFICIAL || ServiceProviderCategory::from($serviceProviderEntity->getCategory()) === ServiceProviderCategory::VLM) {
            ExceptionBuilder::throw(ServiceProviderErrorCode::ServiceProviderNotFound);
        }

        // 事务
        Db::beginTransaction();
        try {
            // 删除服务商配置
            $this->serviceProviderConfigRepository->deleteById($serviceProviderConfigId);

            // 删除服务商下所有的模型
            $this->serviceProviderModelsRepository->deleteByServiceProviderConfigId($serviceProviderConfigId, $organizationCode);
        } catch (Exception $exception) {
            Db::rollBack();
            $this->logger->error('删除服务商失败: ' . $exception->getMessage());
            ExceptionBuilder::throw(ServiceProviderErrorCode::SystemError, __('service_provider.delete_provider_failed'));
        }
        Db::commit();
    }

    public function addModelIdForOrganization(string $modelId, string $organizationCode): void
    {
        // 不可重复添加，以组织纬度+modelId判断，因为其他组织可能也会添加，使用额外方法
        if ($this->serviceProviderOriginalModelsRepository->existByOrganizationCodeAndModelId($organizationCode, $modelId)) {
            ExceptionBuilder::throw(ServiceProviderErrorCode::InvalidParameter, __('service_provider.original_model_already_exists'));
        }

        $serviceProviderOriginalModelsEntity = new ServiceProviderOriginalModelsEntity();
        $serviceProviderOriginalModelsEntity->setModelId($modelId);
        $serviceProviderOriginalModelsEntity->setOrganizationCode($organizationCode);
        $serviceProviderOriginalModelsEntity->setType(OriginalModelType::ORGANIZATION_ADD->value);
        $this->serviceProviderOriginalModelsRepository->insert($serviceProviderOriginalModelsEntity);
    }

    // 删除模型
    public function deleteModelIdForOrganization(string $modelId, string $organizationCode): void
    {
        $this->serviceProviderOriginalModelsRepository->deleteByModelIdAndOrganizationCodeAndType($modelId, $organizationCode, OriginalModelType::ORGANIZATION_ADD->value);
    }

    /**
     * 获取超清修复服务商配置。
     * 从ImageGenerateModelType::getMiracleVisionModes()[0]获取模型。
     * 如果官方和非官方都启用，优先使用非官方配置。
     *
     * @param string $modelId 模型版本
     * @param string $organizationCode 组织编码
     * @return ServiceProviderResponse 服务商配置响应
     */
    public function getMiracleVisionServiceProviderConfig(string $modelId, string $organizationCode): ServiceProviderResponse
    {
        // 直接获取指定模型版本和组织的模型列表
        $models = $this->serviceProviderModelsRepository->getModelsByVersionIdAndOrganization($modelId, $organizationCode);

        if (empty($models)) {
            $this->logger->warning('模型未找到' . $modelId);
            // 如果没有找到模型，抛出异常
            ExceptionBuilder::throw(ServiceProviderErrorCode::ModelNotFound);
        }

        // 收集所有激活的模型
        $activeModels = [];
        foreach ($models as $model) {
            if ($model->getStatus() === Status::ACTIVE->value) {
                $activeModels[] = $model;
            }
        }

        // 如果没有激活的模型，抛出异常
        if (empty($activeModels)) {
            ExceptionBuilder::throw(ServiceProviderErrorCode::ModelNotActive);
        }

        // 从激活的模型中查找可用的服务商配置
        return $this->findAvailableServiceProviderFromModels($activeModels, $organizationCode);
    }

    /**
     * 获取指定组织下的非官方服务商列表.
     *
     * @param string $organizationCode 组织编码
     * @param ServiceProviderCategory $category 服务商类别
     * @return array 非官方服务商列表
     */
    public function getNonOfficialServiceProviders(string $organizationCode, ServiceProviderCategory $category): array
    {
        // 获取非官方服务商列表
        $serviceProviders = $this->serviceProviderRepository->getNonOfficialByCategory($category);

        if (empty($serviceProviders)) {
            return [];
        }

        // 转换为前端需要的格式
        $result = [];
        foreach ($serviceProviders as $serviceProvider) {
            $result[] = [
                'id' => $serviceProvider->getId(),
                'name' => $serviceProvider->getName(),
                'icon' => $serviceProvider->getIcon(),
                'category' => $serviceProvider->getCategory(),
                'provider_type' => $serviceProvider->getProviderType(),
                'description' => $serviceProvider->getDescription(),
            ];
        }

        return $result;
    }

    /**
     * 获取所有非官方服务商列表，不依赖于组织编码
     *
     * @param ServiceProviderCategory $category 服务商类别
     * @return ServiceProviderDTO[]
     */
    public function getAllNonOfficialProviders(ServiceProviderCategory $category): array
    {
        $serviceProviderEntities = $this->serviceProviderRepository->getNonOfficialByCategory($category);
        return ServiceProviderEntityFactory::toDTOs($serviceProviderEntities);
    }

    /**
     * 根据模型类型获取启用模型(优先取组织的).
     */
    public function findSelectedActiveProviderByType(string $organizationCode, ModelType $modelType): ?ServiceProviderResponse
    {
        // 先获取组织的
        if ($model = $this->serviceProviderModelsRepository->findActiveModelByType($modelType, $organizationCode)) {
            return $this->getServiceProviderConfig($model->getModelVersion(), (string) $model->getId(), $organizationCode, false);
        }
        // 再获取官方的
        $model = $this->serviceProviderModelsRepository->findActiveModelByType($modelType, env('OFFICE_ORGANIZATION', ''));
        return $model ? $this->getServiceProviderConfig($model->getModelVersion(), (string) $model->getId(), $organizationCode, false) : null;
    }

    /**
     * 处理脱敏后的配置数据
     * 如果数据是脱敏格式（前3位+星号+后3位），则使用原始值；否则使用新值
     *
     * @param ServiceProviderConfig $newConfig 新的配置数据（可能包含脱敏信息）
     * @param ServiceProviderConfig $oldConfig 旧的配置数据（包含原始值）
     * @return ServiceProviderConfig 处理后的配置数据
     */
    private function processDesensitizedConfig(
        ServiceProviderConfig $newConfig,
        ServiceProviderConfig $oldConfig
    ): ServiceProviderConfig {
        // 检查ak是否为脱敏后的格式
        $ak = $newConfig->getAk();
        if (! empty($ak) && preg_match('/^.{3}\*+.{3}$/', $ak)) {
            $newConfig->setAk($oldConfig->getAk());
        }

        // 检查sk是否为脱敏后的格式
        $sk = $newConfig->getSk();
        if (! empty($sk) && preg_match('/^.{3}\*+.{3}$/', $sk)) {
            $newConfig->setSk($oldConfig->getSk());
        }

        // 检查apiKey是否为脱敏后的格式
        $apiKey = $newConfig->getApiKey();
        if (! empty($apiKey) && preg_match('/^.{3}\*+.{3}$/', $apiKey)) {
            $newConfig->setApiKey($oldConfig->getApiKey());
        }

        return $newConfig;
    }

    /**
     * 从激活的模型中查找可用的服务商配置
     * 优先返回非官方配置，如果没有则返回官方配置.
     *
     * @param ServiceProviderModelsEntity[] $activeModels 激活的模型列表
     * @param string $organizationCode 组织编码
     */
    private function findAvailableServiceProviderFromModels(array $activeModels, string $organizationCode): ServiceProviderResponse
    {
        $serviceProviderResponse = new ServiceProviderResponse();
        $officialFound = false;
        $officialProviderType = null;
        $officialConfig = null;
        $officialModelConfig = null;
        $officialModel = null;
        $officialProviderCode = null;

        foreach ($activeModels as $model) {
            // 获取服务商配置
            $serviceProviderConfigId = $model->getServiceProviderConfigId();
            $serviceProviderConfigEntity = $this->serviceProviderConfigRepository->getByIdAndOrganizationCode(
                (string) $serviceProviderConfigId,
                $organizationCode
            );

            // 获取服务商信息
            $serviceProviderId = $serviceProviderConfigEntity->getServiceProviderId();
            $serviceProviderEntity = $this->serviceProviderRepository->getById($serviceProviderId);

            if (! $serviceProviderEntity) {
                continue;
            }

            // 获取服务商类型
            $providerType = ServiceProviderType::from($serviceProviderEntity->getProviderType());

            // 对于非官方服务商，检查其是否激活
            if ($providerType !== ServiceProviderType::OFFICIAL) {
                // 如果是非官方服务商但未激活，则跳过
                if ($serviceProviderConfigEntity->getStatus() !== Status::ACTIVE->value) {
                    continue;
                }

                // 非官方配置且已激活，优先返回
                $serviceProviderResponse->setServiceProviderType($providerType);
                $serviceProviderResponse->setServiceProviderConfig($serviceProviderConfigEntity->getConfig());
                $serviceProviderResponse->setModelConfig($model->getConfig());
                $serviceProviderResponse->setServiceProviderModelsEntity($model);
                $serviceProviderResponse->setServiceProviderCode($serviceProviderEntity->getProviderCode());
                return $serviceProviderResponse;
            }

            // 记录找到的官方配置，但继续查找非官方配置
            $officialFound = true;
            $officialProviderType = $providerType;
            $officialConfig = $serviceProviderConfigEntity->getConfig();
            $officialProviderCode = $serviceProviderEntity->getProviderCode();
            $officialModelConfig = $model->getConfig();
            $officialModel = $model;
        }

        // 如果找到了官方配置，但没有找到非官方配置，则返回官方配置
        if ($officialFound) {
            $serviceProviderResponse->setServiceProviderType($officialProviderType);
            $serviceProviderResponse->setServiceProviderConfig($officialConfig);
            $serviceProviderResponse->setModelConfig($officialModelConfig);
            $serviceProviderResponse->setServiceProviderModelsEntity($officialModel);
            $serviceProviderResponse->setServiceProviderCode($officialProviderCode);
            return $serviceProviderResponse;
        }

        // 如果没有找到任何可用配置，抛出异常
        ExceptionBuilder::throw(ServiceProviderErrorCode::ServiceProviderNotActive, __('service_provider.provider_not_active'));
    }

    /**
     * 批量创建服务商配置.
     * @param ServiceProviderEntity[] $serviceProviders 服务商实体列表
     * @param string $organizationCode 组织代码
     * @return ServiceProviderConfigEntity[] 创建的服务商配置实体列表
     */
    private function batchCreateServiceProviderConfigs(array $serviceProviders, string $organizationCode): array
    {
        // 创建ServiceProviderConfigEntity对象列表
        $configEntities = [];

        foreach ($serviceProviders as $serviceProvider) {
            $configEntity = new ServiceProviderConfigEntity();
            $configEntity->setServiceProviderId($serviceProvider->getId());
            $configEntity->setOrganizationCode($organizationCode);
            $isOfficial = ServiceProviderType::from($serviceProvider->getProviderType()) === ServiceProviderType::OFFICIAL;
            $configEntity->setStatus($isOfficial ? Status::ACTIVE->value : Status::DISABLE->value);
            $configEntities[] = $configEntity;
        }

        if (! empty($configEntities)) {
            return $this->serviceProviderConfigRepository->batchAddServiceProviderConfigs($configEntities);
        }

        return [];
    }

    /**
     * 处理非官方服务商下的模型保存（情况1.2）.
     */
    private function handleNonOfficialProviderModel(ServiceProviderModelsEntity $serviceProviderModelsEntity, ServiceProviderEntity $serviceProviderEntity): void
    {
        // 获取服务提供商配置
        $serviceProviderConfigEntities = $this->serviceProviderConfigRepository->getsByServiceProviderId(
            $serviceProviderEntity->getId()
        );

        if (empty($serviceProviderConfigEntities)) {
            ExceptionBuilder::throw(ServiceProviderErrorCode::ServiceProviderNotFound);
        }
        $modelArray = $serviceProviderModelsEntity->toArray();
        $insertData = [];
        foreach ($serviceProviderConfigEntities as $serviceProviderConfigEntity) {
            $providerModelsEntity = new ServiceProviderModelsEntity($modelArray);
            $providerModelsEntity->setOrganizationCode($serviceProviderConfigEntity->getOrganizationCode());
            $providerModelsEntity->setServiceProviderConfigId($serviceProviderConfigEntity->getId());
            $insertData[] = $providerModelsEntity;
        }

        $this->serviceProviderModelsRepository->batchInsert($insertData);
    }
}
