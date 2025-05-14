<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Application\SuperAgent\Service;

use App\Application\Kernel\SuperPermissionEnum;
use App\Domain\Contact\Service\MagicUserDomainService;
use App\Infrastructure\Util\Auth\PermissionChecker;
use Hyperf\Logger\LoggerFactory;
use Psr\Log\LoggerInterface;

class ConfigAppService
{
    private LoggerInterface $logger;

    public function __construct(
        LoggerFactory $loggerFactory,
        protected MagicUserDomainService $userDomainService,
    ) {
        $this->logger = $loggerFactory->get('config');
    }

    /**
     * 检查是否应该重定向到SuperMagic页面.
     *
     * @param mixed $userAuthorization
     * @return array 配置结果
     */
    public function shouldRedirectToSuperMagic($userAuthorization): array
    {
        // 获取部署ID
        $deploymentId = config('super-magic.sandbox.deployment_id', '');
        $userId = $userAuthorization->getId();
        $organizationCode = $userAuthorization->getOrganizationCode();

        $shouldRedirect = true;

        $isOrganizationAdmin = false;
        $isInviteUser = false;
        $isSuperMagicBoardManager = false;
        $isSuperMagicBoardOperator = false;

        $userPhoneNumber = $this->userDomainService->getUserPhoneByUserId($userId);
        // 检查是否是组织拥有者或者管理员
        if (class_exists(PermissionChecker::class)) {
            $permissionChecker = make(PermissionChecker::class);
            $isOrganizationAdmin = $permissionChecker->isOrganizationAdmin($organizationCode, $userPhoneNumber);

            // 检查是否是邀请用户
            $isInviteUser = PermissionChecker::mobileHasPermission($userPhoneNumber, SuperPermissionEnum::SUPER_INVITE_USER);

            // 检查是否是超级麦吉看板管理人员
            $isSuperMagicBoardManager = PermissionChecker::mobileHasPermission($userPhoneNumber, SuperPermissionEnum::SUPER_MAGIC_BOARD_ADMIN);

            // 检查是否是超级麦吉看板运营人员
            $isSuperMagicBoardOperator = PermissionChecker::mobileHasPermission($userPhoneNumber, SuperPermissionEnum::SUPER_MAGIC_BOARD_OPERATOR);
        }

        $this->logger->info('检查是否是特定用户', [
            'isOrganizationAdmin' => $isOrganizationAdmin,
            'isInviteUser' => $isInviteUser,
            'isSuperMagicBoardManager' => $isSuperMagicBoardManager,
            'isSuperMagicBoardOperator' => $isSuperMagicBoardOperator,
        ]);

        if (! $isOrganizationAdmin && ! $isInviteUser && ! $isSuperMagicBoardManager && ! $isSuperMagicBoardOperator) {
            // 根据header 判断返回中文还是英文
            $shouldRedirect = false;
        }

        // // 特定的部署ID列表，这些ID应该重定向到SuperMagic
        $redirectDeploymentIds = ['a2503897', 'a1565492'];

        // // 特定的组织编码列表，这些组织编码不应该重定向到SuperMagic
        // $excludedOrganizationCodes = ['41036eed2c3ada9fb8460883fcebba81', 'e43290d104d9a20c5589eb3d81c6b440'];

        // // 首先检查组织编码是否在排除列表中
        if ($isOrganizationAdmin && in_array($deploymentId, $redirectDeploymentIds, true)) {
            $shouldRedirect = true;
        } else {
            $shouldRedirect = false;
        }

        $this->logger->info('检查是否重定向到SuperMagic', [
            'deployment_id' => $deploymentId,
            'organization_code' => $organizationCode,
            'should_redirect' => $shouldRedirect,
        ]);

        return [
            'should_redirect' => $shouldRedirect,
            'deployment_id' => $deploymentId,
            'organization_code' => $organizationCode,
        ];
    }
}
