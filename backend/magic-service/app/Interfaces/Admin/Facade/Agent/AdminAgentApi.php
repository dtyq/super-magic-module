<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Interfaces\Admin\Facade\Agent;

use App\Application\Admin\Agent\Service\AdminAgentAppService;
use App\Application\Permission\Service\OperationPermissionAppService;
use App\Domain\Admin\Entity\ValueObject\AgentFilterType;
use App\Interfaces\Admin\DTO\Request\QueryPageAgentDTO;
use App\Interfaces\Authorization\Web\MagicUserAuthorization;
use Dtyq\ApiResponse\Annotation\ApiResponse;
use Hyperf\HttpServer\Contract\RequestInterface;
use Qbhy\HyperfAuth\AuthManager;

#[ApiResponse('low_code')]
class AdminAgentApi extends AbstractApi
{
    public function __construct(
        protected AdminAgentAppService $adminAgentAppService,
        protected OperationPermissionAppService $permissionAppService,
        RequestInterface $request,
        AuthManager $authManager,
    ) {
        parent::__construct(
            $authManager,
            $request,
        );
    }

    public function getPublishedAgents()
    {
        $pageToken = $this->request->input('page_token', '');
        $pageSize = (int) $this->request->input('page_size', 20);
        $type = AgentFilterType::from((int) $this->request->input('type', AgentFilterType::ALL->value));

        return $this->adminAgentAppService->getPublishedAgents(
            $this->getAuthorization(),
            $pageToken,
            $pageSize,
            $type
        );
    }

    public function queriesAgents(RequestInterface $request)
    {
        /**
         * @var MagicUserAuthorization $authenticatable
         */
        $authenticatable = $this->getAuthorization();
        $queryPageAgentDTO = new QueryPageAgentDTO($request->all());
        return $this->adminAgentAppService->queriesAgents($authenticatable, $queryPageAgentDTO);
    }

    public function getAgentDetail(RequestInterface $request, string $agentId)
    {
        /**
         * @var MagicUserAuthorization $authenticatable
         */
        $authenticatable = $this->getAuthorization();
        return $this->adminAgentAppService->getAgentDetail($authenticatable, $agentId);
    }
}
