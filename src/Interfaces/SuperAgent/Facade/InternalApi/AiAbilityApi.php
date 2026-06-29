<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Interfaces\SuperAgent\Facade\InternalApi;

use Dtyq\ApiResponse\Annotation\ApiResponse;
use Dtyq\SuperMagic\Application\SuperAgent\Service\AiAbilityRuntimeConfigAppService;
use Dtyq\SuperMagic\Interfaces\SuperAgent\Facade\AbstractApi;
use Hyperf\HttpServer\Contract\RequestInterface;

/**
 * 沙箱 AI 能力运行时配置接口.
 */
#[ApiResponse('low_code')]
class AiAbilityApi extends AbstractApi
{
    /**
     * 初始化沙箱 AI 能力运行时配置接口.
     */
    public function __construct(
        protected RequestInterface $request,
        private readonly AiAbilityRuntimeConfigAppService $runtimeConfigAppService,
    ) {
        parent::__construct($request);
    }

    /**
     * 获取 super-magic 运行时消费的 AI 能力配置.
     */
    public function runtimeConfig(): array
    {
        return $this->runtimeConfigAppService->getRuntimeConfig();
    }
}
