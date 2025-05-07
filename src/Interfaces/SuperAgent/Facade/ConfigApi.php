<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Interfaces\SuperAgent\Facade;

use App\Infrastructure\Util\Context\RequestContext;
use Dtyq\ApiResponse\Annotation\ApiResponse;
use Dtyq\SuperMagic\Application\SuperAgent\Service\ConfigAppService;
use Hyperf\HttpServer\Contract\RequestInterface;
use Throwable;

#[ApiResponse('low_code')]
class ConfigApi extends AbstractApi
{
    public function __construct(
        protected RequestInterface $request,
        private readonly ConfigAppService $configAppService,
    ) {
    }

    /**
     * 判断用户是否默认跳转到supermagic页面.
     *
     * @param RequestContext $requestContext 请求上下文
     * @return array 配置结果
     */
    public function shouldRedirectToSuperMagic(RequestContext $requestContext): array
    {
        // 设置用户授权信息（如果有的话）
        try {
            $requestContext->setUserAuthorization($this->getAuthorization());
        } catch (Throwable $e) {
            // 如果获取用户授权失败，不影响功能继续运行
        }

        // 调用应用服务处理业务逻辑
        return $this->configAppService->shouldRedirectToSuperMagic($this->getAuthorization());
    }
}
