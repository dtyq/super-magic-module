<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\Chat\Event\Subscribe\Device;

use App\Domain\Chat\Event\Device\DeviceDisconnectEvent;
use Hyperf\Event\Annotation\Listener;
use Hyperf\Event\Contract\ListenerInterface;
use Hyperf\SocketIOServer\Room\RedisAdapter;

#[Listener]
readonly class DeviceDisconnectSubscriber implements ListenerInterface
{
    public function __construct(
        private RedisAdapter $adapter,
    ) {
    }

    public function listen(): array
    {
        return [
            DeviceDisconnectEvent::class,
        ];
    }

    public function process(object $event): void
    {
        /** @var DeviceDisconnectEvent $event */
        $sid = $event->getSid();
        $this->adapter->disconnectSid($sid);
    }
}
