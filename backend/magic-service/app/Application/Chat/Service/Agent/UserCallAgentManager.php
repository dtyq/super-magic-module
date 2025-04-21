<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\Chat\Service\Agent;

use App\Domain\Chat\Event\Agent\UserCallAgentEvent;
use App\Infrastructure\Core\Contract\Agent\UserCallAgentInterface;
use Psr\Container\ContainerInterface;

class UserCallAgentManager
{
    /**
     * 当前使用的处理器.
     */
    protected ?UserCallAgentInterface $handler = null;

    /**
     * 当前处理器的优先级.
     */
    protected int $currentPriority = -1;

    public function __construct(
        protected ContainerInterface $container
    ) {
        // 在构造函数中注册默认处理器
        $this->registerHandler($container->get(DefaultUserCallAgentService::class));
    }

    /**
     * 注册处理器，根据优先级决定是否替换当前处理器.
     */
    public function registerHandler(UserCallAgentInterface $handler): void
    {
        $handlerClass = get_class($handler);
        $priority = $handlerClass::getPriority();

        // 只有当新处理器的优先级大于当前处理器时，才进行替换
        if ($priority > $this->currentPriority) {
            $this->handler = $handler;
            $this->currentPriority = $priority;
        }
    }

    /**
     * 处理事件.
     */
    public function process(UserCallAgentEvent $event): void
    {
        $aiCode = $event->agentAccountEntity->getAiCode();

        if ($this->handler !== null && $this->handler->canHandle($aiCode)) {
            $this->handler->process($event);
            return;
        }

        // 如果当前处理器无法处理，使用默认处理器
        $this->container->get(DefaultUserCallAgentService::class)->process($event);
    }
}
