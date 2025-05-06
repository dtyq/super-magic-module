<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Interfaces\SuperAgent\Facade;

use App\Infrastructure\Util\Context\RequestContext;
use Dtyq\ApiResponse\Annotation\ApiResponse;
use Dtyq\SuperMagic\Application\SuperAgent\Service\LogAppService;
use Hyperf\HttpServer\Contract\RequestInterface;

#[ApiResponse('low_code')]
class LogApi extends AbstractApi
{
    public function __construct(
        private readonly LogAppService $logAppService,
        private readonly RequestInterface $request
    ) {
    }

    public function reportLog(RequestContext $requestContext): array
    {
        // 设置用户授权信息
        $requestContext->setUserAuthorization($this->getAuthorization());
        $log = $this->request->input('log', '');
        if (empty($log)) {
            return [];
        }
        // 保存日志
        $this->logAppService->saveLog($log);
        return [];
    }
}
