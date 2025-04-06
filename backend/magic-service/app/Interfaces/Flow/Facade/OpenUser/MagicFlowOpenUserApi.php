<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Interfaces\Flow\Facade\OpenUser;

use App\Application\Flow\Service\MagicFlowAppService;
use App\Domain\Flow\Entity\ValueObject\Query\MagicFLowQuery;
use App\Interfaces\Flow\Assembler\Flow\MagicFlowAssembler;
use Dtyq\ApiResponse\Annotation\ApiResponse;
use Hyperf\Di\Annotation\Inject;

#[ApiResponse(version: 'low_code')]
class MagicFlowOpenUserApi extends AbstractOpenUserApi
{
    #[Inject]
    protected MagicFlowAppService $magicFlowAppService;

    public function queries()
    {
        $params = $this->request->all();
        $query = new MagicFLowQuery($params);
        $query->setOrder(['updated_at' => 'desc']);

        $authorization = $this->getAuthorization();
        $page = $this->createPage();
        $result = $this->magicFlowAppService->queries($authorization, $query, $page);
        return MagicFlowAssembler::createPageListDTO($result['total'], $result['list'], $page, $result['users'], $result['icons']);
    }
}
