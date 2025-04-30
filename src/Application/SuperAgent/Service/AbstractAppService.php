<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Application\SuperAgent\Service;

use App\Application\Kernel\AbstractKernelAppService;
use App\Infrastructure\Core\Traits\DataIsolationTrait;

class AbstractAppService extends AbstractKernelAppService
{
    use DataIsolationTrait;
}
