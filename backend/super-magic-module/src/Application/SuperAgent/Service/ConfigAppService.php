<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Application\SuperAgent\Service;

use Hyperf\HttpServer\Contract\RequestInterface;
use Hyperf\Logger\LoggerFactory;
use Psr\Log\LoggerInterface;

class ConfigAppService
{
    private LoggerInterface $logger;

    public function __construct(
        LoggerFactory $loggerFactory,
        private readonly RequestInterface $request,
    ) {
        $this->logger = $loggerFactory->get('config');
    }

    /**
     * 检查是否应该重定向到SuperMagic页面.
     *
     * @return array 配置结果
     */
    public function shouldRedirectToSuperMagic(): array
    {
        // 获取部署ID
        $deploymentId = env('DEPLOYMENT_ID', '');

        // 获取组织编码
        $organizationCode = $this->request->header('organization_code', '');

        // 特定的部署ID列表，这些ID应该重定向到SuperMagic
        $redirectDeploymentIds = ['a2503897', 'a1565492'];

        // 特定的组织编码列表，这些组织编码不应该重定向到SuperMagic
        $excludedOrganizationCodes = ['41036eed2c3ada9fb8460883fcebba81', 'e43290d104d9a20c5589eb3d81c6b440'];

        // 首先检查组织编码是否在排除列表中
        if (in_array($organizationCode, $excludedOrganizationCodes, true)) {
            $shouldRedirect = false;
        } else {
            // 如果不在排除列表中，则检查部署ID
            $shouldRedirect = in_array($deploymentId, $redirectDeploymentIds, true);
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
