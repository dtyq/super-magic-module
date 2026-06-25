<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Interfaces\SuperAgent\Facade\OpenApi;

use Dtyq\ApiResponse\Annotation\ApiResponse;
use Dtyq\SuperMagic\Application\SuperAgent\Service\OAuth2CallbackRelayAppService;
use Dtyq\SuperMagic\Interfaces\Agent\Facade\Sandbox\AbstractSuperMagicSandboxApi;
use Hyperf\HttpServer\Contract\RequestInterface;
use Qbhy\HyperfAuth\AuthManager;

/**
 * OAuth2 callback relay 接口。
 */
#[ApiResponse(version: 'low_code')]
class OAuth2CallbackRelayApi extends AbstractSuperMagicSandboxApi
{
    public function __construct(
        AuthManager $authManager,
        RequestInterface $request,
        private readonly OAuth2CallbackRelayAppService $callbackRelayAppService,
    ) {
        parent::__construct($authManager, $request);
    }

    /**
     * 供 super-magic 按 state 拉取 callback payload。
     */
    public function fetchCallback(): array
    {
        $authorization = $this->getAuthorization();
        return $this->callbackRelayAppService->fetchCallback($authorization, (string) $this->request->query('state', ''));
    }

    /**
     * 删除 super-magic 已消费的 callback payload。
     */
    public function deleteCallback(): array
    {
        $authorization = $this->getAuthorization();
        return $this->callbackRelayAppService->deleteCallback($authorization, (string) $this->request->query('state', ''));
    }
}
