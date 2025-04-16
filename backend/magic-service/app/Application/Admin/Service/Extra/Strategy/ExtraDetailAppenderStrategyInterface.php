<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\Admin\Service\Extra\Strategy;

use App\Interfaces\Admin\DTO\Extra\AbstractSettingExtraDTO;
use App\Interfaces\Authorization\Web\MagicUserAuthorization;

interface ExtraDetailAppenderStrategyInterface
{
    public function appendExtraDetail(AbstractSettingExtraDTO $extraDTO, MagicUserAuthorization $userAuthorization): AbstractSettingExtraDTO;
}
