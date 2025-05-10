<?php

namespace App\Application\KnowledgeBase\Service\Strategy\KnowledgeBase;

use App\Application\Kernel\AbstractKernelAppService;
use App\Application\Permission\Service\OperationPermissionAppService;
use App\Domain\KnowledgeBase\Entity\ValueObject\KnowledgeBaseDataIsolation;
use App\Domain\KnowledgeBase\Entity\ValueObject\KnowledgeType;
use App\Domain\Permission\Entity\ValueObject\OperationPermission\Operation;
use App\Domain\Permission\Entity\ValueObject\OperationPermission\ResourceType;

class KnowledgeBaseStrategy extends AbstractKernelAppService implements KnowledgeBaseStrategyInterface
{
    public function __construct(
        protected OperationPermissionAppService $operationPermissionAppService,
    )
    {
    }

    /**
     * @param KnowledgeBaseDataIsolation $dataIsolation
     * @return array<string, Operation>
     */
    public function getKnowledgeBaseOperations(KnowledgeBaseDataIsolation $dataIsolation): array
    {
        $permissionDataIsolation = $this->createPermissionDataIsolation($dataIsolation);
        return $this->operationPermissionAppService->getResourceOperationByUserIds(
            $permissionDataIsolation,
            ResourceType::Knowledge,
            [$dataIsolation->getCurrentUserId()]
        )[$dataIsolation->getCurrentUserId()] ?? [];
    }

    public function getQueryKnowledgeTypes(): array
    {
        return [KnowledgeType::UserKnowledgeBase->value];
    }
}