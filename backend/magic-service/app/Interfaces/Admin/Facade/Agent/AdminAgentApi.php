<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Interfaces\Admin\Facade\Agent;

use App\Application\Admin\Agent\Service\AdminAgentAppService;
use App\Domain\Admin\Entity\ValueObject\AgentFilterType;
use Dtyq\ApiResponse\Annotation\ApiResponse;
use Hyperf\HttpServer\Contract\RequestInterface;
use Qbhy\HyperfAuth\AuthManager;

#[ApiResponse('low_code')]
class AdminAgentApi extends AbstractApi
{
    public function __construct(
        protected AdminAgentAppService $adminAgentAppService,
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
}
