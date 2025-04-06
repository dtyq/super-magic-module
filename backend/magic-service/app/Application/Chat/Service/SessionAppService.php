<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\Chat\Service;

use App\Domain\Authentication\DTO\LoginResponseDTO;
use App\Domain\Contact\Service\MagicUserDomainService;
use App\Domain\OrganizationEnvironment\Entity\MagicEnvironmentEntity;
use App\Infrastructure\Core\Contract\Session\LoginCheckInterface;
use App\Infrastructure\Core\Contract\Session\SessionInterface;

class SessionAppService implements SessionInterface
{
    /**
     * 登录校验.
     * @return LoginResponseDTO[]
     */
    public function LoginCheck(LoginCheckInterface $loginCheck, MagicEnvironmentEntity $magicEnvironmentEntity, ?string $magicOrganizationCode = null): array
    {
        return di(MagicUserDomainService::class)->magicUserLoginCheck($loginCheck->getAuthorization(), $magicEnvironmentEntity, $magicOrganizationCode);
    }
}
