<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\Flow\Event\Subscribe;

use App\Application\Chat\Service\MagicAccountAppService;
use App\Domain\Contact\Entity\MagicUserEntity;
use App\Domain\Contact\Entity\ValueObject\UserType;
use App\Domain\Flow\Entity\MagicFlowEntity;
use App\Domain\Flow\Entity\ValueObject\Type;
use App\Domain\Flow\Event\MagicFlowChangeEnabledEvent;
use App\Interfaces\Authorization\Web\MagicUserAuthorization;
use Dtyq\AsyncEvent\Kernel\Annotation\AsyncListener;
use Hyperf\Event\Annotation\Listener;
use Hyperf\Event\Contract\ListenerInterface;
use Psr\Container\ContainerInterface;

#[AsyncListener]
#[Listener]
readonly class AIRegistrationSubscriber implements ListenerInterface
{
    public function __construct(private ContainerInterface $container)
    {
    }

    public function listen(): array
    {
        return [
            //            MagicFlowChangeEnabledEvent::class,
        ];
    }

    public function process(object $event): void
    {
        /** @var MagicFlowChangeEnabledEvent $event */
        $magicFlowEntity = $event->magicFlowEntity;
        if (! $magicFlowEntity instanceof MagicFlowEntity) {
            return;
        }

        // 启用才保存 AI
        if (! $magicFlowEntity->isEnabled()) {
            return;
        }

        // 只有主流程才需要被注册
        if ($magicFlowEntity->getType() !== Type::Main) {
            return;
        }

        $user = new MagicUserEntity();
        $user->setAvatarUrl($magicFlowEntity->getIcon() ?: 'default');
        $user->setNickName($magicFlowEntity->getName());
        $user->setDescription($magicFlowEntity->getDescription() ?: $magicFlowEntity->getName());

        $authorization = new MagicUserAuthorization();
        $authorization->setId($magicFlowEntity->getCreator());
        $authorization->setMagicId($magicFlowEntity->getCreator());
        $authorization->setOrganizationCode($magicFlowEntity->getOrganizationCode());
        $authorization->setUserType(UserType::Human);
        $magicAccountAppService = $this->container->get(MagicAccountAppService::class);
        $magicAccountAppService->aiRegister($user, $authorization, $magicFlowEntity->getCode());
    }
}
