<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\KnowledgeBase\Service;

use App\Domain\KnowledgeBase\Entity\KnowledgeBaseFragmentEntity;
use App\Domain\KnowledgeBase\Entity\ValueObject\Query\KnowledgeBaseFragmentQuery;
use App\Infrastructure\Core\ValueObject\Page;
use Qbhy\HyperfAuth\Authenticatable;

class KnowledgeBaseFragmentAppService extends AbstractKnowledgeAppService
{
    public function save(Authenticatable $authorization, KnowledgeBaseFragmentEntity $savingMagicFlowKnowledgeFragmentEntity): KnowledgeBaseFragmentEntity
    {
        $dataIsolation = $this->createKnowledgeBaseDataIsolation($authorization);
        $this->checkKnowledgeBaseOperation($dataIsolation, 'w', $savingMagicFlowKnowledgeFragmentEntity->getKnowledgeCode(), $savingMagicFlowKnowledgeFragmentEntity->getDocumentCode());
        $savingMagicFlowKnowledgeFragmentEntity->setCreator($dataIsolation->getCurrentUserId());
        $knowledgeBaseDocumentEntity = $this->knowledgeBaseDocumentDomainService->show($dataIsolation, $savingMagicFlowKnowledgeFragmentEntity->getDocumentCode());
        $knowledgeBaseEntity = $this->knowledgeBaseDomainService->show($dataIsolation, $savingMagicFlowKnowledgeFragmentEntity->getKnowledgeCode());
        return $this->knowledgeBaseFragmentDomainService->save($dataIsolation, $knowledgeBaseEntity, $knowledgeBaseDocumentEntity, $savingMagicFlowKnowledgeFragmentEntity);
    }

    /**
     * @return array{total: int, list: array<KnowledgeBaseFragmentEntity>}
     */
    public function queries(Authenticatable $authorization, KnowledgeBaseFragmentQuery $query, Page $page): array
    {
        $dataIsolation = $this->createKnowledgeBaseDataIsolation($authorization);
        $this->checkKnowledgeBaseOperation($dataIsolation, 'r', $query->getKnowledgeCode(), $query->getDocumentCode());

        return $this->knowledgeBaseFragmentDomainService->queries($dataIsolation, $query, $page);
    }

    public function show(Authenticatable $authorization, string $knowledgeBaseCode, string $documentCode, int $id): KnowledgeBaseFragmentEntity
    {
        $dataIsolation = $this->createKnowledgeBaseDataIsolation($authorization);
        $this->checkKnowledgeBaseOperation($dataIsolation, 'r', $knowledgeBaseCode, $documentCode, $id);
        return $this->knowledgeBaseFragmentDomainService->show($dataIsolation, $id);
    }

    public function destroy(Authenticatable $authorization, string $knowledgeBaseCode, string $documentCode, int $id): void
    {
        $dataIsolation = $this->createKnowledgeBaseDataIsolation($authorization);
        $this->checkKnowledgeBaseOperation($dataIsolation, 'del', $knowledgeBaseCode, $documentCode, $id);
        $knowledgeBaseEntity = $this->knowledgeBaseDomainService->show($dataIsolation, $knowledgeBaseCode);
        $oldEntity = $this->knowledgeBaseFragmentDomainService->show($dataIsolation, $id);
        $this->knowledgeBaseFragmentDomainService->destroy($dataIsolation, $knowledgeBaseEntity, $oldEntity);
    }
}
