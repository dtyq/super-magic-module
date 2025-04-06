<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\KnowledgeBase\Service;

use App\Domain\KnowledgeBase\Entity\KnowledgeBaseFragmentEntity;
use App\Domain\KnowledgeBase\Entity\ValueObject\KnowledgeBaseDataIsolation;
use App\Domain\KnowledgeBase\Entity\ValueObject\Query\KnowledgeBaseFragmentQuery;
use App\Infrastructure\Core\ValueObject\Page;
use Hyperf\DbConnection\Annotation\Transactional;
use Hyperf\DbConnection\Db;
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

        return Db::transaction(function () use ($knowledgeBaseDocumentEntity, $knowledgeBaseEntity, $savingMagicFlowKnowledgeFragmentEntity, $dataIsolation) {
            $oldEntity = $this->knowledgeBaseFragmentDomainService->show($dataIsolation, $savingMagicFlowKnowledgeFragmentEntity->getId() ?? 0, true, false);
            $newEntity = $this->knowledgeBaseFragmentDomainService->save($dataIsolation, $knowledgeBaseEntity, $knowledgeBaseDocumentEntity, $savingMagicFlowKnowledgeFragmentEntity);
            // 需要更新字符数
            $deltaWordCount = $newEntity->getWordCount() - $oldEntity?->getWordCount() ?? 0;
            $this->updateWordCount($dataIsolation, $newEntity, $deltaWordCount);
            return $newEntity;
        });
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

        Db::transaction(function () use ($knowledgeBaseEntity, $id, $dataIsolation) {
            $oldEntity = $this->knowledgeBaseFragmentDomainService->show($dataIsolation, $id, true, false);
            $this->knowledgeBaseFragmentDomainService->destroy($dataIsolation, $knowledgeBaseEntity, $oldEntity);
            // 需要更新字符数
            $deltaWordCount = -$oldEntity->getWordCount();
            $this->updateWordCount($dataIsolation, $oldEntity, $deltaWordCount);
        });
    }

    public function destroyByMetadataFilter(Authenticatable $authorization, string $knowledgeCode, array $metadataFilter): void
    {
        $dataIsolation = $this->createKnowledgeBaseDataIsolation($authorization);
        $this->checkKnowledgeBaseOperation($dataIsolation, 'del', $knowledgeCode);

        $magicFlowKnowledgeEntity = $this->knowledgeBaseDomainService->show($dataIsolation, $knowledgeCode);
        $this->knowledgeBaseFragmentDomainService->destroyByMetadataFilter($dataIsolation, $magicFlowKnowledgeEntity, $metadataFilter);
    }

    #[Transactional]
    private function updateWordCount(KnowledgeBaseDataIsolation $dataIsolation, KnowledgeBaseFragmentEntity $entity, int $deltaWordCount): void
    {
        // 更新数据库字数统计
        $this->knowledgeBaseDomainService->updateKnowledgeBaseWordCount($dataIsolation, $entity->getKnowledgeCode(), $deltaWordCount);
        // 更新文档字数统计
        $this->knowledgeBaseDocumentDomainService->updateWordCount($dataIsolation, $entity->getDocumentCode(), $deltaWordCount);
    }
}
