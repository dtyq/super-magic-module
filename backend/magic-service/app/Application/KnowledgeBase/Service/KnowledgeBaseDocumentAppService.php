<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\KnowledgeBase\Service;

use App\Domain\Flow\Entity\ValueObject\Query\KnowledgeBaseDocumentQuery;
use App\Domain\KnowledgeBase\Entity\KnowledgeBaseDocumentEntity;
use App\Infrastructure\Core\Embeddings\VectorStores\VectorStoreDriver;
use App\Infrastructure\Core\ValueObject\Page;
use App\Interfaces\KnowledgeBase\DTO\DocumentFileDTO;
use Qbhy\HyperfAuth\Authenticatable;

class KnowledgeBaseDocumentAppService extends AbstractKnowledgeAppService
{
    /**
     * @return array<string, int> array<知识库code, 文档数量>
     */
    public function getDocumentCountByKnowledgeBaseCodes(Authenticatable $authorization, array $knowledgeBaseCodes): array
    {
        return $this->knowledgeBaseDocumentDomainService->getDocumentCountByKnowledgeBaseCodes($this->createKnowledgeBaseDataIsolation($authorization), $knowledgeBaseCodes);
    }

    /**
     * 保存知识库文档.
     */
    public function save(Authenticatable $authorization, KnowledgeBaseDocumentEntity $documentEntity, ?DocumentFileDTO $documentFile = null): KnowledgeBaseDocumentEntity
    {
        $dataIsolation = $this->createKnowledgeBaseDataIsolation($authorization);
        $this->checkKnowledgeBaseOperation($dataIsolation, 'w', $documentEntity->getKnowledgeBaseCode(), $documentEntity->getCode());
        $documentEntity->setCreatedUid($dataIsolation->getCurrentUserId());
        $documentEntity->setUpdatedUid($dataIsolation->getCurrentUserId());
        $knowledgeBaseEntity = $this->knowledgeBaseDomainService->show($dataIsolation, $documentEntity->getKnowledgeBaseCode());

        // 文档配置继承知识库
        $documentEntity->setFragmentConfig($knowledgeBaseEntity->getFragmentConfig());
        $documentEntity->setRetrieveConfig($knowledgeBaseEntity->getRetrieveConfig());
        $documentEntity->setEmbeddingConfig($knowledgeBaseEntity->getEmbeddingConfig());
        // 设置默认的嵌入模型和向量数据库
        $documentEntity->setEmbeddingModel($knowledgeBaseEntity->getModel());
        $documentEntity->setVectorDb(VectorStoreDriver::default()->value);

        // 调用领域服务保存文档
        if (! empty($documentFile)) {
            $fileLink = $this->getFileLink($dataIsolation->getCurrentOrganizationCode(), $documentFile->getKey());
            $documentFile->setFileLink($fileLink);
        }
        if (! $documentEntity->getCode()) {
            // 新建文档
            return $this->knowledgeBaseDocumentDomainService->create($dataIsolation, $knowledgeBaseEntity, $documentEntity, $this->documentFileDTOToVO($documentFile));
        }
        return $this->knowledgeBaseDocumentDomainService->update($dataIsolation, $knowledgeBaseEntity, $documentEntity);
    }

    /**
     * 查询知识库文档列表.
     *
     * @return array{total: int, list: array<KnowledgeBaseDocumentEntity>}
     */
    public function query(Authenticatable $authorization, KnowledgeBaseDocumentQuery $query, Page $page): array
    {
        $dataIsolation = $this->createKnowledgeBaseDataIsolation($authorization);

        // 验证知识库的权限
        $this->checkKnowledgeBaseOperation($dataIsolation, 'r', $query->getKnowledgeBaseCode(), $query->getCode());

        // 调用领域服务查询文档
        $entities = $this->knowledgeBaseDocumentDomainService->queries($dataIsolation, $query, $page);
        // 兼容旧数据，新增默认文档
        if (empty($entities['list'])) {
            $knowledgeBaseEntity = $this->knowledgeBaseDomainService->show($dataIsolation, $query->getKnowledgeBaseCode());
            $entity = $this->knowledgeBaseDocumentDomainService->getOrCreateDefaultDocument($dataIsolation, $knowledgeBaseEntity);
            $entities['list'] = [$entity];
            $entities['total'] = 1;
        }
        $documentCodeFinalSyncStatusMap = $this->knowledgeBaseFragmentDomainService->getFinalSyncStatusByDocumentCodes(
            $dataIsolation,
            array_map(fn ($entity) => $entity->getCode(), $entities['list'])
        );
        // 获取文档同步状态
        foreach ($entities['list'] as $entity) {
            if (isset($documentCodeFinalSyncStatusMap[$entity->getCode()])) {
                $entity->setSyncStatus($documentCodeFinalSyncStatusMap[$entity->getCode()]->value);
            }
        }
        return $entities;
    }

    /**
     * 查看单个知识库文档详情.
     */
    public function show(Authenticatable $authorization, string $knowledgeBaseCode, string $documentCode): KnowledgeBaseDocumentEntity
    {
        $dataIsolation = $this->createKnowledgeBaseDataIsolation($authorization);
        $this->checkKnowledgeBaseOperation($dataIsolation, 'r', $knowledgeBaseCode, $documentCode);

        // 获取文档
        $entity = $this->knowledgeBaseDocumentDomainService->show($dataIsolation, $documentCode);
        $documentCodeFinalSyncStatusMap = $this->knowledgeBaseFragmentDomainService->getFinalSyncStatusByDocumentCodes($dataIsolation, [$documentCode]);
        isset($documentCodeFinalSyncStatusMap[$documentCode]) && $entity->setSyncStatus($documentCodeFinalSyncStatusMap[$documentCode]->value);
        return $entity;
    }

    /**
     * 删除知识库文档.
     */
    public function destroy(Authenticatable $authorization, string $knowledgeBaseCode, string $documentCode): void
    {
        $dataIsolation = $this->createKnowledgeBaseDataIsolation($authorization);
        $this->checkKnowledgeBaseOperation($dataIsolation, 'del', $knowledgeBaseCode, $documentCode);

        // 调用领域服务删除文档
        $this->knowledgeBaseDocumentDomainService->destroy($dataIsolation, $documentCode);
    }
}
