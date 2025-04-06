<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Interfaces\Flow\Facade\Admin;

use App\Application\Flow\Service\MagicFlowAIModelAppService;
use App\Domain\Flow\Entity\MagicFlowAIModelEntity;
use App\Interfaces\Authorization\Web\MagicUserAuthorization;
use App\Interfaces\Flow\Assembler\AIModel\MagicFlowAIModelAssembler;
use Dtyq\ApiResponse\Annotation\ApiResponse;
use Hyperf\Di\Annotation\Inject;

#[ApiResponse(version: 'low_code')]
class MagicFlowAIModelFlowAdminApi extends AbstractFlowAdminApi
{
    #[Inject]
    protected MagicFlowAIModelAppService $magicFlowAIModelAppService;

    public function getEnabled()
    {
        /** @var MagicUserAuthorization $authorization */
        $authorization = $this->getAuthorization();
        $data = $this->magicFlowAIModelAppService->getEnabled($authorization);
        $iconPaths = array_map(fn (MagicFlowAIModelEntity $item) => $item->getIcon(), $data['list']);
        $icons = $this->magicFlowAIModelAppService->getIcons($authorization->getOrganizationCode(), $iconPaths);
        return MagicFlowAIModelAssembler::createEnabledListDTO($data['list'], $icons);
    }
}
