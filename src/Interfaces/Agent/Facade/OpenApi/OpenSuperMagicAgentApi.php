<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Interfaces\Agent\Facade\OpenApi;

use App\ErrorCode\GenericErrorCode;
use App\Infrastructure\Core\Exception\ExceptionBuilder;
use App\Infrastructure\Util\Context\RequestCoContext;
use Dtyq\ApiResponse\Annotation\ApiResponse;
use Dtyq\SuperMagic\Application\Agent\Service\SuperMagicAgentAppService;
use Dtyq\SuperMagic\Interfaces\Agent\DTO\Request\GetMyAvailableAgentsRequestDTO;
use Dtyq\SuperMagic\Interfaces\SuperAgent\Facade\AbstractApi;
use Hyperf\HttpServer\Contract\RequestInterface;

#[ApiResponse('low_code')]
class OpenSuperMagicAgentApi extends AbstractApi
{
    public function __construct(
        protected RequestInterface $request,
        private readonly SuperMagicAgentAppService $superMagicAgentAppService,
    ) {
        parent::__construct($request);
    }

    public function getMyAvailableAgents(): array
    {
        $authorization = RequestCoContext::getUserAuthorization();
        if (empty($authorization)) {
            ExceptionBuilder::throw(GenericErrorCode::ParameterMissing, 'user_authorization_not_found');
        }

        $requestDTO = GetMyAvailableAgentsRequestDTO::fromRequest($this->request);

        return $this->superMagicAgentAppService->getMyAvailableAgents($authorization, $requestDTO);
    }
}
