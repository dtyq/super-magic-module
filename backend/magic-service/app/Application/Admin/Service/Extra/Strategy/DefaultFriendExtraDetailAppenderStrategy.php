<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\Admin\Service\Extra\Strategy;

use App\Interfaces\Admin\DTO\Extra\AbstractSettingExtraDTO;
use App\Interfaces\Admin\DTO\Extra\DefaultFriendExtraDTO;
use App\Interfaces\Authorization\Web\MagicUserAuthorization;
use InvalidArgumentException;

class DefaultFriendExtraDetailAppenderStrategy implements ExtraDetailAppenderStrategyInterface
{
    public function appendExtraDetail(AbstractSettingExtraDTO $extraDTO, MagicUserAuthorization $userAuthorization): AbstractSettingExtraDTO
    {
        if (! $extraDTO instanceof DefaultFriendExtraDTO) {
            throw new InvalidArgumentException('Expected DefaultFriendExtraDTO');
        }

        return $extraDTO;
    }
}
