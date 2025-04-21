<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\KnowledgeBase\Service;

use App\Domain\Contact\Entity\MagicUserEntity;
use App\Domain\KnowledgeBase\Entity\KnowledgeBaseEntity;
use App\Domain\KnowledgeBase\Entity\ValueObject\DocumentFileVO;
use App\Domain\KnowledgeBase\Entity\ValueObject\Query\KnowledgeBaseQuery;
use App\Domain\ModelAdmin\Constant\ModelType;
use App\Domain\Permission\Entity\ValueObject\OperationPermission\Operation;
use App\Domain\Permission\Entity\ValueObject\OperationPermission\ResourceType;
use App\Infrastructure\Core\Embeddings\EmbeddingGenerator\EmbeddingGenerator;
use App\Infrastructure\Core\Embeddings\VectorStores\VectorStoreDriver;
use App\Infrastructure\Core\ValueObject\Page;
use App\Interfaces\KnowledgeBase\DTO\DocumentFileDTO;
use Qbhy\HyperfAuth\Authenticatable;

class KnowledgeBaseAppService extends AbstractKnowledgeAppService
{
    /**
     * @param array<DocumentFileDTO> $documentFiles
     */
    public function save(Authenticatable $authorization, KnowledgeBaseEntity $magicFlowKnowledgeEntity, array $documentFiles = []): KnowledgeBaseEntity
    {
        $dataIsolation = $this->createKnowledgeBaseDataIsolation($authorization);
        $magicFlowKnowledgeEntity->setOrganizationCode($dataIsolation->getCurrentOrganizationCode());
        $magicFlowKnowledgeEntity->setCreator($dataIsolation->getCurrentUserId());

        $oldKnowledge = null;
        // 如果具有业务 id，那么就是更新了，需要先查询出来
        if (! empty($magicFlowKnowledgeEntity->getBusinessId())) {
            $oldKnowledge = $this->getByBusinessId($authorization, $magicFlowKnowledgeEntity->getBusinessId());
            if ($oldKnowledge) {
                $magicFlowKnowledgeEntity->setCode($oldKnowledge->getCode());
            }
        }

        // 更惨数据 - 查询权限
        if (! $magicFlowKnowledgeEntity->shouldCreate() && ! $oldKnowledge) {
            $oldKnowledge = $this->knowledgeBaseDomainService->show($dataIsolation, $magicFlowKnowledgeEntity->getCode(), false);
        }
        $operation = Operation::None;
        if ($oldKnowledge) {
            $operation = $this->getKnowledgeOperation($dataIsolation, $oldKnowledge->getCode());
            $operation->validate('w', $oldKnowledge->getCode());
        }

        // 设置嵌入模型和向量数据库
        $model = $this->serviceProviderDomainService->findSelectedActiveProviderByType($dataIsolation->getCurrentOrganizationCode(), ModelType::EMBEDDING);
        $magicFlowKnowledgeEntity->setModel($model?->getServiceProviderModelsEntity()?->getModelId() ?? EmbeddingGenerator::defaultModel());
        $magicFlowKnowledgeEntity->setVectorDB(VectorStoreDriver::default()->value);

        // 获取 文件
        $files = $this->getFileLinks($dataIsolation->getCurrentOrganizationCode(), array_map(fn ($dto) => $dto->getKey(), $documentFiles));
        foreach ($documentFiles as $documentFile) {
            if ($fileLink = $files[$documentFile->getKey()] ?? null) {
                $documentFile->setFileLink($fileLink);
            }
        }

        $knowledgeBaseEntity = $this->knowledgeBaseDomainService->save($dataIsolation, $magicFlowKnowledgeEntity, DocumentFileVO::fromDTOList($documentFiles));
        $knowledgeBaseEntity->setUserOperation($operation->value);
        $iconFileLink = $this->getFileLink($dataIsolation->getCurrentOrganizationCode(), $knowledgeBaseEntity->getIcon());
        $knowledgeBaseEntity->setIcon($iconFileLink?->getUrl() ?? '');
        return $knowledgeBaseEntity;
    }

    public function saveProcess(Authenticatable $authorization, KnowledgeBaseEntity $savingKnowledgeEntity): KnowledgeBaseEntity
    {
        $dataIsolation = $this->createKnowledgeBaseDataIsolation($authorization);
        $savingKnowledgeEntity->setCreator($dataIsolation->getCurrentUserId());
        $this->checkKnowledgeBaseOperation($dataIsolation, 'w', $savingKnowledgeEntity->getCode());

        return $this->knowledgeBaseDomainService->saveProcess($dataIsolation, $savingKnowledgeEntity);
    }

    public function getByBusinessId(Authenticatable $authorization, string $businessId, ?int $type = null): ?KnowledgeBaseEntity
    {
        if (empty($businessId)) {
            return null;
        }
        $dataIsolation = $this->createKnowledgeBaseDataIsolation($authorization);
        $permissionDataIsolation = $this->createPermissionDataIsolation($dataIsolation);

        $resources = $this->operationPermissionAppService->getResourceOperationByUserIds(
            $permissionDataIsolation,
            ResourceType::Knowledge,
            [$authorization->getId()]
        )[$authorization->getId()] ?? [];
        $resourceIds = array_keys($resources);
        // 在这一堆中查找一个
        $query = new KnowledgeBaseQuery();
        $query->setCodes($resourceIds);
        $query->setBusinessId($businessId);
        $query->setType($type);
        $result = $this->knowledgeBaseDomainService->queries($dataIsolation, $query, new Page(1, 1));
        return $result['list'][0] ?? null;
    }

    /**
     * @return array{total: int, list: array<KnowledgeBaseEntity>, users: array<MagicUserEntity>}
     */
    public function queries(Authenticatable $authorization, KnowledgeBaseQuery $query, Page $page): array
    {
        $dataIsolation = $this->createKnowledgeBaseDataIsolation($authorization);
        $permissionDataIsolation = $this->createPermissionDataIsolation($dataIsolation);

        $resources = $this->operationPermissionAppService->getResourceOperationByUserIds(
            $permissionDataIsolation,
            ResourceType::Knowledge,
            [$authorization->getId()]
        )[$authorization->getId()] ?? [];
        $resourceIds = array_keys($resources);

        $query->setCodes($resourceIds);
        $result = $this->knowledgeBaseDomainService->queries($dataIsolation, $query, $page);
        $userIds = [];
        $iconFileLinks = $this->getIcons($dataIsolation->getCurrentOrganizationCode(), array_map(fn ($item) => $item->getIcon(), $result['list']));
        foreach ($result['list'] as $item) {
            $userIds[] = $item->getCreator();
            $userIds[] = $item->getModifier();
            $iconFileLink = $iconFileLinks[$item->getIcon()] ?? null;
            $item->setIcon($iconFileLink?->getUrl() ?? '');
            $item->setUserOperation(($resources[$item->getCode()] ?? Operation::None)->value);
        }
        $result['users'] = $this->magicUserDomainService->getByUserIds($this->createContactDataIsolationByBase($dataIsolation), $userIds);
        return $result;
    }

    public function show(Authenticatable $authorization, string $code): KnowledgeBaseEntity
    {
        $dataIsolation = $this->createKnowledgeBaseDataIsolation($authorization);
        $operation = $this->checkKnowledgeBaseOperation($dataIsolation, 'r', $code);
        $knowledge = $this->knowledgeBaseDomainService->show($dataIsolation, $code, true);
        $knowledge->setUserOperation($operation->value);
        $iconFileLink = $this->fileDomainService->getLink($dataIsolation->getCurrentOrganizationCode(), $knowledge->getIcon());
        $knowledge->setIcon($iconFileLink?->getUrl() ?? '');
        return $knowledge;
    }

    public function destroy(Authenticatable $authorization, string $code): void
    {
        $dataIsolation = $this->createKnowledgeBaseDataIsolation($authorization);
        $this->checkKnowledgeBaseOperation($dataIsolation, 'del', $code);
        $magicFlowKnowledgeEntity = $this->knowledgeBaseDomainService->show($dataIsolation, $code);
        $this->knowledgeBaseDomainService->destroy($dataIsolation, $magicFlowKnowledgeEntity);
    }
}
