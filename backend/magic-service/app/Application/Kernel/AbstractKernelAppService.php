<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\Kernel;

use App\Application\Flow\ExecuteManager\ExecutionData\Operator;
use App\Domain\Authentication\Entity\ValueObject\AuthenticationDataIsolation;
use App\Domain\Contact\Entity\ValueObject\DataIsolation as ContactDataIsolation;
use App\Domain\File\Service\FileDomainService;
use App\Domain\Flow\Entity\ValueObject\FlowDataIsolation;
use App\Domain\KnowledgeBase\Entity\ValueObject\KnowledgeBaseDataIsolation;
use App\Domain\ModelGateway\Entity\ValueObject\LLMDataIsolation;
use App\Domain\Permission\Entity\ValueObject\PermissionDataIsolation;
use App\ErrorCode\GenericErrorCode;
use App\Infrastructure\Core\DataIsolation\BaseDataIsolation;
use App\Infrastructure\Core\DataIsolation\HandleDataIsolationInterface;
use App\Infrastructure\Core\Exception\ExceptionBuilder;
use App\Infrastructure\Util\Auth\PermissionChecker;
use App\Interfaces\Authorization\Web\MagicUserAuthorization;
use Dtyq\CloudFile\Kernel\Struct\FileLink;
use Qbhy\HyperfAuth\Authenticatable;

abstract class AbstractKernelAppService
{
    /**
     * @return array<string,FileLink>
     */
    public function getIcons(string $organizationCode, array $icons): array
    {
        $icons = array_filter($icons);
        return di(FileDomainService::class)->getLinks($organizationCode, $icons);
    }

    public function getFileLink(string $organizationCode, string $icon): ?FileLink
    {
        return di(FileDomainService::class)->getLink($organizationCode, $icon);
    }

    protected function createExecutionOperator(Authenticatable|BaseDataIsolation $authorization): Operator
    {
        $flowDataIsolation = $this->createFlowDataIsolation($authorization);

        $operator = new Operator();
        $operator->setUid($flowDataIsolation->getCurrentUserId());
        $operator->setOrganizationCode($flowDataIsolation->getCurrentOrganizationCode());

        if ($authorization instanceof MagicUserAuthorization) {
            $operator->setUid($authorization->getId());
            $operator->setOrganizationCode($authorization->getOrganizationCode());
            $operator->setNickname($authorization->getNickname());
            $operator->setRealName($authorization->getRealName());
            $operator->setAvatar($authorization->getAvatar());
            $operator->setMagicId($authorization->getMagicId());
        }
        if (! $operator->hasUid()) {
            ExceptionBuilder::throw(GenericErrorCode::SystemError, 'flow.system.uid_not_found');
        }

        return $operator;
    }

    protected function createContactDataIsolationByBase(BaseDataIsolation $dataIsolation): ContactDataIsolation
    {
        return ContactDataIsolation::create($dataIsolation->getCurrentOrganizationCode(), $dataIsolation->getCurrentUserId());
    }

    protected function createAuthenticationDataIsolation(Authenticatable|BaseDataIsolation $authorization): AuthenticationDataIsolation
    {
        $dataIsolation = new AuthenticationDataIsolation();
        if ($authorization instanceof BaseDataIsolation) {
            $dataIsolation->extends($authorization);
            return $dataIsolation;
        }
        $this->handleByAuthorization($authorization, $dataIsolation);
        return $dataIsolation;
    }

    protected function createFlowDataIsolation(Authenticatable|BaseDataIsolation $authorization): FlowDataIsolation
    {
        $dataIsolation = new FlowDataIsolation();
        if ($authorization instanceof BaseDataIsolation) {
            $dataIsolation->extends($authorization);
            return $dataIsolation;
        }
        $this->handleByAuthorization($authorization, $dataIsolation);
        return $dataIsolation;
    }

    protected function createKnowledgeBaseDataIsolation(Authenticatable|BaseDataIsolation $authorization): KnowledgeBaseDataIsolation
    {
        $dataIsolation = new KnowledgeBaseDataIsolation();
        if ($authorization instanceof BaseDataIsolation) {
            $dataIsolation->extends($authorization);
            return $dataIsolation;
        }
        $this->handleByAuthorization($authorization, $dataIsolation);
        return $dataIsolation;
    }

    protected static function createFlowDataIsolationStaticMethod(Authenticatable|BaseDataIsolation $authorization): FlowDataIsolation
    {
        $dataIsolation = new FlowDataIsolation();
        if ($authorization instanceof BaseDataIsolation) {
            $dataIsolation->extends($authorization);
            return $dataIsolation;
        }
        self::handleByAuthorizationStaticMethod($authorization, $dataIsolation);
        return $dataIsolation;
    }

    protected function createLLMDataIsolation(Authenticatable|BaseDataIsolation $authorization): LLMDataIsolation
    {
        $dataIsolation = new LLMDataIsolation();
        if ($authorization instanceof BaseDataIsolation) {
            $dataIsolation->extends($authorization);
            return $dataIsolation;
        }
        $this->handleByAuthorization($authorization, $dataIsolation);
        return $dataIsolation;
    }

    protected function createPermissionDataIsolation(Authenticatable|BaseDataIsolation $authorization): PermissionDataIsolation
    {
        $dataIsolation = new PermissionDataIsolation();
        if ($authorization instanceof BaseDataIsolation) {
            $dataIsolation->extends($authorization);
            return $dataIsolation;
        }
        $this->handleByAuthorization($authorization, $dataIsolation);
        return $dataIsolation;
    }

    protected function checkInternalWhite(Authenticatable $authorization, SuperPermissionEnum $permission): void
    {
        if ($authorization instanceof MagicUserAuthorization) {
            if (PermissionChecker::mobileHasPermission($authorization->getMobile(), $permission)) {
                return;
            }
        }
        ExceptionBuilder::throw(GenericErrorCode::AccessDenied);
    }

    protected function handleByAuthorization(Authenticatable $authorization, BaseDataIsolation $baseDataIsolation): void
    {
        $envId = 0;
        $handleDataIsolation = di(HandleDataIsolationInterface::class);
        $handleDataIsolation->handleByAuthorization($authorization, $baseDataIsolation, $envId);
        EnvManager::initDataIsolationEnv($baseDataIsolation, $envId);
    }

    private static function handleByAuthorizationStaticMethod(Authenticatable $authorization, BaseDataIsolation $baseDataIsolation): void
    {
        $envId = 0;
        $handleDataIsolation = di(HandleDataIsolationInterface::class);
        $handleDataIsolation->handleByAuthorization($authorization, $baseDataIsolation, $envId);
        EnvManager::initDataIsolationEnv($baseDataIsolation, $envId);
    }
}
