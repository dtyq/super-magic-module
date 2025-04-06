<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\Chat\Event\Device;

use App\Infrastructure\Core\AbstractEvent;

/**
 * 服务端对设备的链接保活失效.
 */
class DeviceDisconnectEvent extends AbstractEvent
{
    public function __construct(
        protected string $sid
    ) {
        $this->setSid($sid);
    }

    public function getSid(): string
    {
        return $this->sid;
    }

    public function setSid(string $sid): void
    {
        $this->sid = $sid;
    }
}
