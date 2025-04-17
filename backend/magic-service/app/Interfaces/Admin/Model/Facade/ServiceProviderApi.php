<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Interfaces\Admin\Model\Facade;

use App\Application\Admin\Model\Service\ServiceProviderAppService;
use App\Application\Chat\Service\MagicAccountAppService;
use App\Application\Chat\Service\MagicUserContactAppService;
use App\Application\Kernel\SuperPermissionEnum;
use App\Domain\Model\Constant\ModelType;
use App\Domain\Model\Constant\ServiceProviderCategory;
use App\Domain\Model\Entity\ServiceProviderConfigEntity;
use App\Domain\Model\Entity\ServiceProviderEntity;
use App\Domain\Model\Entity\ServiceProviderModelsEntity;
use App\Domain\Model\Entity\ValueObject\ServiceProviderConfigDTO;
use App\ErrorCode\ChatErrorCode;
use App\ErrorCode\UserErrorCode;
use App\Infrastructure\Core\Exception\ExceptionBuilder;
use App\Infrastructure\Util\Auth\PermissionChecker;
use App\Interfaces\Facade\Open\AbstractApi;
use Dtyq\ApiResponse\Annotation\ApiResponse;
use Hyperf\Di\Annotation\Inject;
use Hyperf\HttpServer\Contract\RequestInterface;

#[ApiResponse('low_code')]
class ServiceProviderApi extends AbstractApi
{
    #[Inject]
    protected ServiceProviderAppService $serviceProviderAppService;

    // 获取厂商
    public function getServiceProviders(RequestInterface $request)
    {
        $this->isInWhiteListForOrgization();
        $authenticatable = $this->getAuthorization();
        $category = $request->input('category');

        $serviceProviderCategory = ServiceProviderCategory::tryFrom($category);
        return $this->serviceProviderAppService->getServiceProviders($authenticatable, $serviceProviderCategory);
    }

    // 获取厂商详细信息
    public function getServiceProviderConfig(RequestInterface $request)
    {
        $this->isInWhiteListForOrgization();
        $authenticatable = $this->getAuthorization();

        return $this->serviceProviderAppService->getServiceProviderConfig($request->input('service_provider_config_id', ''), $authenticatable->getOrganizationCode());
    }

    // 更新厂商
    public function updateServiceProviderConfig(RequestInterface $request)
    {
        $this->isInWhiteListForOrgization();
        $authenticatable = $this->getAuthorization();
        $serviceProviderConfigEntity = new ServiceProviderConfigEntity($request->all());
        $serviceProviderConfigEntity->setOrganizationCode($authenticatable->getOrganizationCode());
        return $this->serviceProviderAppService->updateServiceProviderConfig($serviceProviderConfigEntity);
    }

    // 修改模型状态
    public function updateModelStatus(RequestInterface $request)
    {
        $this->isInWhiteListForOrgization();
        $authenticatable = $this->getAuthorization();
        $modelId = $request->input('model_id', '');
        $status = $request->input('status', 0);
        $organizationCode = $authenticatable->getOrganizationCode();
        $this->serviceProviderAppService->updateModelStatus($modelId, $status, $organizationCode);
    }

    // 获取模型列表(获取最新的模型) 也就是刷新当前厂商的模型信息
    public function refreshModels(RequestInterface $request)
    {
        $this->isInWhiteListForOrgization();
        $authenticatable = $this->getAuthorization();
        $serviceProviderConfigId = $request->input('service_provider_config_id');
        $organizationCode = $authenticatable->getOrganizationCode();
        $this->serviceProviderAppService->refreshModels($serviceProviderConfigId, $organizationCode);
    }

    // 添加服务商
    public function addServiceProvider(RequestInterface $request)
    {
        $this->isInWhiteListForAdmin();
        $authenticatable = $this->getAuthorization();
        $serviceProviderEntity = new ServiceProviderEntity($request->all());
        return $this->serviceProviderAppService->addServiceProvider($serviceProviderEntity);
    }

    // 保存模型
    public function saveModelToServiceProvider(RequestInterface $request)
    {
        $this->isInWhiteListForOrgization();
        $authenticatable = $this->getAuthorization();
        $serviceProviderModelsEntity = new ServiceProviderModelsEntity($request->all());
        $serviceProviderModelsEntity->setOrganizationCode($authenticatable->getOrganizationCode());
        return $this->serviceProviderAppService->saveModelToServiceProvider($serviceProviderModelsEntity);
    }

    // 连通性测试
    public function connectivityTest(RequestInterface $request)
    {
        $this->isInWhiteListForOrgization();
        $authenticatable = $this->getAuthorization();
        $serviceProviderConfigId = $request->input('service_provider_config_id');
        $modelVersion = $request->input('model_version');
        $modelId = $request->input('model_id');
        return $this->serviceProviderAppService->connectivityTest($serviceProviderConfigId, $modelVersion, $modelId, $authenticatable);
    }

    // 删除模型
    public function deleteModel(RequestInterface $request)
    {
        $this->isInWhiteListForOrgization();

        $authenticatable = $this->getAuthorization();
        $modelId = $request->input('model_id');
        $this->serviceProviderAppService->deleteModel($modelId, $authenticatable->getOrganizationCode());
    }

    // 获取原始模型id
    public function getOriginalModels(RequestInterface $request)
    {
        $this->isInWhiteListForOrgization();

        $authenticatable = $this->getAuthorization();
        return $this->serviceProviderAppService->getOriginalModels($authenticatable);
    }

    // 获取原始模型id
    public function listOriginalModels(RequestInterface $request)
    {
        $this->isInWhiteListForOrgization();

        $authenticatable = $this->getAuthorization();
        return $this->serviceProviderAppService->listOriginalModels($authenticatable);
    }

    // 增加原始模型id
    public function addOriginalModel(RequestInterface $request)
    {
        $this->isInWhiteListForOrgization();

        $authenticatable = $this->getAuthorization();
        $modelId = $request->input('model_id');
        $this->serviceProviderAppService->addOriginalModel($modelId);
    }

    // 删除原始模型id
    public function deleteOriginalModel(RequestInterface $request)
    {
        $this->isInWhiteListForAdmin();
        $authenticatable = $this->getAuthorization();
        $modelId = $request->input('model_id');
        $this->serviceProviderAppService->deleteOriginalModel($modelId);
    }

    // 根据服务商分类获取模型
    public function getServiceProvidersByCategory(RequestInterface $request)
    {
        $authenticatable = $this->getAuthorization();
        $category = $request->input('category');
        $modelType = $request->input('model_type', -1); // 控制为null
        $modelType = ModelType::tryFrom($modelType);
        $serviceProviderCategory = ServiceProviderCategory::tryFrom($category);
        $serviceProviderConfigId = $request->input('service_provider_config_id');

        if ($serviceProviderConfigId) {
            // 如果指定了具体的服务商配置ID，则返回该服务商的详细信息
            return $this->serviceProviderAppService->getServiceProviderConfig(
                $serviceProviderConfigId,
                $authenticatable->getOrganizationCode()
            );
        }

        // 否则返回所有服务商及其模型信息
        return $this->serviceProviderAppService->getActiveModelsByOrganizationCode(
            $authenticatable->getOrganizationCode(),
            $serviceProviderCategory,
            $modelType
        );
    }

    // 组织添加服务商
    public function addServiceProviderForOrganization(RequestInterface $request)
    {
        $this->isInWhiteListForOrgization();
        $authenticatable = $this->getAuthorization();
        $serviceProviderConfigDTO = new ServiceProviderConfigDTO($request->all());
        return $this->serviceProviderAppService->addServiceProviderForOrganization($serviceProviderConfigDTO, $authenticatable);
    }

    // 删除服务商
    public function deleteServiceProviderForOrganization(RequestInterface $request)
    {
        $this->isInWhiteListForOrgization();
        $authenticatable = $this->getAuthorization();
        $serviceProviderConfigId = $request->input('service_provider_config_id');
        $this->serviceProviderAppService->deleteServiceProviderForOrganization($serviceProviderConfigId, $authenticatable);
    }

    // 组织添加模型标识
    public function addModelIdForOrganization(RequestInterface $request)
    {
        $this->isInWhiteListForOrgization();
        $authenticatable = $this->getAuthorization();
        $modelId = $request->input('model_id');
        $this->serviceProviderAppService->addModelIdForOrganization($modelId, $authenticatable);
    }

    // 组织删除模型标识
    public function deleteModelIdForOrganization(RequestInterface $request)
    {
        $this->isInWhiteListForOrgization();
        $authenticatable = $this->getAuthorization();
        $modelId = $request->input('model_id');
        $this->serviceProviderAppService->deleteModelIdForOrganization($modelId, $authenticatable);
    }

    // 删除模型(一般是官方的和文生图的模型)
    public function deleteModelForAdmin(RequestInterface $request)
    {
        $this->isInWhiteListForAdmin();
        $authenticatable = $this->getAuthorization();
        $modelId = $request->input('model_id');
        $this->serviceProviderAppService->deleteModelForAdmin($authenticatable, $modelId);
    }

    public function saveModelToServiceProviderForAdmin(RequestInterface $request)
    {
        $this->isInWhiteListForAdmin();
        $authenticatable = $this->getAuthorization();
        $serviceProviderModelsEntity = new ServiceProviderModelsEntity($request->all());
        $serviceProviderModelsEntity->setOrganizationCode($authenticatable->getOrganizationCode());
        return $this->serviceProviderAppService->saveModelToServiceProviderForAdmin($serviceProviderModelsEntity);
    }

    // 删除服务商
    public function deleteServiceProviderForAdmin(RequestInterface $request)
    {
        $this->isInWhiteListForAdmin();
        $serviceProviderConfigId = $request->input('service_provider_config_id');
        $authenticatable = $this->getAuthorization();
        $this->serviceProviderAppService->deleteServiceProviderForAdmin($serviceProviderConfigId, $authenticatable->getOrganizationCode());
    }

    public function updateServiceProvider(RequestInterface $request)
    {
        $this->isInWhiteListForAdmin();
        $authenticatable = $this->getAuthorization();
        $serviceProviderEntity = new ServiceProviderEntity($request->all());
        return $this->serviceProviderAppService->updateServiceProvider($serviceProviderEntity, $authenticatable->getOrganizationCode());
    }

    /**
     * 获取所有非官方LLM服务商列表
     * 直接从数据库中查询category为llm且provider_type不为OFFICIAL的服务商
     * 不依赖于当前组织，适用于需要添加服务商的场景.
     */
    public function getNonOfficialLlmProviders(RequestInterface $request)
    {
        $this->isInWhiteListForOrgization();
        $authenticatable = $this->getAuthorization();
        // 直接获取所有LLM类型的非官方服务商
        return $this->serviceProviderAppService->getAllNonOfficialProviders(ServiceProviderCategory::LLM, $authenticatable->getOrganizationCode());
    }

    public function addModelId(RequestInterface $request)
    {
        $this->isInWhiteListForAdmin();
        $this->getAuthorization();
        $modelId = $request->input('model_id');
        return $this->serviceProviderAppService->addModelId($modelId);
    }

    // 获取当前组织是否是官方组织
    public function isCurrentOrganizationOfficial(): array
    {
        $officialOrganization = config('service_provider.office_organization');
        $organizationCode = $this->getAuthorization()->getOrganizationCode();
        return [
            'is_official' => $officialOrganization === $organizationCode,
            'official_organization' => $officialOrganization,
        ];
    }

    private function getPhone(string $userId)
    {
        $magicUserContactAppService = di(MagicUserContactAppService::class);
        $user = $magicUserContactAppService->getByUserId($userId);
        $magicAccountAppService = di(MagicAccountAppService::class);
        $accountEntity = $magicAccountAppService->getAccountInfoByMagicId($user->getMagicId());
        return $accountEntity->getPhone();
    }

    // 判断当前用户是否在白名单中
    private function isInWhiteListForOrgization()
    {
        $authenticatable = $this->getAuthorization();
        $phone = $this->getPhone($authenticatable->getId());
        $whiteMap = \Hyperf\Config\config('permission.organization_whitelists');
        if (empty($whiteMap) || ! isset($whiteMap[$authenticatable->getOrganizationCode()]) || ! in_array($phone, $whiteMap[$authenticatable->getOrganizationCode()])) {
            ExceptionBuilder::throw(UserErrorCode::ORGANIZATION_NOT_AUTHORIZE);
        }
    }

    private function isInWhiteListForAdmin()
    {
        $authenticatable = $this->getAuthorization();
        if (! PermissionChecker::mobileHasPermission($authenticatable->getMobile(), SuperPermissionEnum::SERVICE_PROVIDER_ADMIN)) {
            ExceptionBuilder::throw(ChatErrorCode::OPERATION_FAILED);
        }
    }
}
