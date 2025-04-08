<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\KnowledgeBase\Service;

use App\Application\File\Service\FileAppService;
use App\Domain\Flow\Entity\ValueObject\Query\KnowledgeBaseDocumentQuery;
use App\Domain\KnowledgeBase\Entity\KnowledgeBaseDocumentEntity;
use App\Infrastructure\Core\Embeddings\EmbeddingGenerator\EmbeddingGenerator;
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

        // 设置默认的嵌入模型和向量数据库
        $documentEntity->setEmbeddingModel(EmbeddingGenerator::defaultModel());
        $documentEntity->setVectorDb(VectorStoreDriver::default()->value);

        // 调用领域服务保存文档
        if (! empty($documentFile)) {
            $fileLink = $this->getFileAppService()->publicFileDownload($documentFile->getKey());
            $documentFile->setFileLink($fileLink);
        }

        $knowledgeBaseEntity = $this->knowledgeBaseDomainService->show($dataIsolation, $documentEntity->getKnowledgeBaseCode());
        if (! $documentEntity->getCode()) {
            // 新建文档
            return $this->knowledgeBaseDocumentDomainService->create($dataIsolation, $knowledgeBaseEntity, $documentEntity, $documentFile);
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
        return $this->knowledgeBaseDocumentDomainService->queries($dataIsolation, $query, $page);
    }

    /**
     * 查看单个知识库文档详情.
     */
    public function show(Authenticatable $authorization, string $knowledgeBaseCode, string $documentCode): KnowledgeBaseDocumentEntity
    {
        $dataIsolation = $this->createKnowledgeBaseDataIsolation($authorization);
        $this->checkKnowledgeBaseOperation($dataIsolation, 'r', $knowledgeBaseCode, $documentCode);

        // 获取文档
        return $this->knowledgeBaseDocumentDomainService->show($dataIsolation, $documentCode);
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

    private function getFileAppService(): FileAppService
    {
        return di(FileAppService::class);
    }
}
