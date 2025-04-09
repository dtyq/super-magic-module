<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\KnowledgeBase\Service;

use App\Domain\Flow\Entity\ValueObject\Query\KnowledgeBaseDocumentQuery;
use App\Domain\KnowledgeBase\Entity\KnowledgeBaseDocumentEntity;
use App\Domain\KnowledgeBase\Entity\KnowledgeBaseEntity;
use App\Domain\KnowledgeBase\Entity\ValueObject\DocType;
use App\Domain\KnowledgeBase\Entity\ValueObject\DocumentFileVO;
use App\Domain\KnowledgeBase\Entity\ValueObject\KnowledgeBaseDataIsolation;
use App\Domain\KnowledgeBase\Entity\ValueObject\KnowledgeSyncStatus;
use App\Domain\KnowledgeBase\Event\KnowledgeBaseDocumentRemovedEvent;
use App\Domain\KnowledgeBase\Event\KnowledgeBaseDocumentSavedEvent;
use App\Domain\KnowledgeBase\Repository\Facade\KnowledgeBaseDocumentRepositoryInterface;
use App\ErrorCode\FlowErrorCode;
use App\Infrastructure\Core\Embeddings\EmbeddingGenerator\EmbeddingGenerator;
use App\Infrastructure\Core\Embeddings\VectorStores\VectorStoreDriver;
use App\Infrastructure\Core\Exception\ExceptionBuilder;
use App\Infrastructure\Core\ValueObject\Page;
use Dtyq\AsyncEvent\AsyncEventUtil;

/**
 * 知识库文档领域服务
 */
readonly class KnowledgeBaseDocumentDomainService
{
    public function __construct(
        private KnowledgeBaseDocumentRepositoryInterface $knowledgeBaseDocumentRepository
    ) {
    }

    public function create(KnowledgeBaseDataIsolation $dataIsolation, KnowledgeBaseEntity $knowledgeBaseEntity, KnowledgeBaseDocumentEntity $documentEntity, ?DocumentFileVO $documentFile = null): KnowledgeBaseDocumentEntity
    {
        $this->prepareForCreation($documentEntity, $documentFile);
        $entity = $this->knowledgeBaseDocumentRepository->create($dataIsolation, $documentEntity);
        // 如果有文件，同步文件
        if ($documentFile) {
            $event = new KnowledgeBaseDocumentSavedEvent($knowledgeBaseEntity, $entity, true, $documentFile);
            AsyncEventUtil::dispatch($event);
        }
        return $entity;
    }

    public function update(KnowledgeBaseDataIsolation $dataIsolation, KnowledgeBaseEntity $knowledgeBaseEntity, KnowledgeBaseDocumentEntity $documentEntity): KnowledgeBaseDocumentEntity
    {
        $oldDocument = $this->show($dataIsolation, $documentEntity->getCode());
        $this->prepareForUpdate($documentEntity, $oldDocument);
        return $this->knowledgeBaseDocumentRepository->update($dataIsolation, $documentEntity);
    }

    /**
     * 查询知识库文档列表.
     *
     * @return array{total: int, list: array<KnowledgeBaseDocumentEntity>}
     */
    public function queries(KnowledgeBaseDataIsolation $dataIsolation, KnowledgeBaseDocumentQuery $query, Page $page): array
    {
        return $this->knowledgeBaseDocumentRepository->queries($dataIsolation, $query, $page);
    }

    /**
     * 查看单个知识库文档详情.
     */
    public function show(KnowledgeBaseDataIsolation $dataIsolation, string $documentCode): KnowledgeBaseDocumentEntity
    {
        $document = $this->knowledgeBaseDocumentRepository->show($dataIsolation, $documentCode);
        if ($document === null) {
            ExceptionBuilder::throw(FlowErrorCode::KnowledgeValidateFailed, 'common.not_found', ['label' => 'document']);
        }
        return $document;
    }

    /**
     * 删除知识库文档.
     */
    public function destroy(KnowledgeBaseDataIsolation $dataIsolation, string $documentCode): void
    {
        // 首先删除文档下的所有片段
        $this->destroyFragments($dataIsolation, $documentCode);
        $documentEntity = $this->show($dataIsolation, $documentCode);
        // 然后删除文档本身
        $this->knowledgeBaseDocumentRepository->destroy($dataIsolation, $documentCode);
        // 异步删除向量数据库片段
        AsyncEventUtil::dispatch(new KnowledgeBaseDocumentRemovedEvent($documentEntity));
    }

    /**
     * 重建知识库文档向量索引.
     */
    public function rebuild(KnowledgeBaseDataIsolation $dataIsolation, string $documentCode, bool $force = false): void
    {
        $document = $this->show($dataIsolation, $documentCode);

        // 如果强制重建或者同步状态为失败，则重新同步
        if ($force || $document->getSyncStatus() === 2) { // 2 表示同步失败
            $document->setSyncStatus(0); // 0 表示未同步
            $document->setSyncStatusMessage('');
            $document->setSyncTimes(0);
            $this->knowledgeBaseDocumentRepository->update($dataIsolation, $document);

            // 异步触发重建（这里可以发送事件或者加入队列）
            // TODO: 触发重建向量事件
        }
    }

    public function updateWordCount(KnowledgeBaseDataIsolation $dataIsolation, string $documentCode, int $deltaWordCount): void
    {
        if ($deltaWordCount === 0) {
            return;
        }
        $this->knowledgeBaseDocumentRepository->updateWordCount($dataIsolation, $documentCode, $deltaWordCount);
    }

    /**
     * @return array<string, int> array<知识库code, 文档数量>
     */
    public function getDocumentCountByKnowledgeBaseCodes(KnowledgeBaseDataIsolation $dataIsolation, array $knowledgeBaseCodes): array
    {
        return $this->knowledgeBaseDocumentRepository->getDocumentCountByKnowledgeBaseCode($dataIsolation, $knowledgeBaseCodes);
    }

    public function changeSyncStatus(KnowledgeBaseDataIsolation $dataIsolation, KnowledgeBaseDocumentEntity $documentEntity): void
    {
        $this->knowledgeBaseDocumentRepository->changeSyncStatus($dataIsolation, $documentEntity);
    }

    public function getOrCreateDefaultDocument(KnowledgeBaseDataIsolation $dataIsolation, KnowledgeBaseEntity $knowledgeBaseEntity): KnowledgeBaseDocumentEntity
    {
        // 尝试获取默认文档
        $documentEntity = $this->knowledgeBaseDocumentRepository->show($dataIsolation, KnowledgeBaseDocumentEntity::getDefaultDocumentCode());
        if ($documentEntity) {
            return $documentEntity;
        }
        // 如果文档不存在，创建新的默认文档
        $documentEntity = (new KnowledgeBaseDocumentEntity())
            ->setCode(KnowledgeBaseDocumentEntity::getDefaultDocumentCode())
            ->setName('未命名文档')
            ->setKnowledgeBaseCode($knowledgeBaseEntity->getCode())
            ->setCreatedUid($knowledgeBaseEntity->getCreator())
            ->setUpdatedUid($knowledgeBaseEntity->getCreator())
            ->setDocType(DocType::TXT->value)
            ->setSyncStatus(KnowledgeSyncStatus::Synced->value)
            ->setOrganizationCode($knowledgeBaseEntity->getOrganizationCode())
            ->setEmbeddingModel(EmbeddingGenerator::defaultModel())
            ->setFragmentConfig([])
            ->setVectorDb(VectorStoreDriver::default()->value);
        return $this->knowledgeBaseDocumentRepository->restoreOrCreate($dataIsolation, $documentEntity);
    }

    /**
     * 删除文档下的所有片段.
     */
    private function destroyFragments(KnowledgeBaseDataIsolation $dataIsolation, string $documentCode): void
    {
        $this->knowledgeBaseDocumentRepository->destroyFragmentsByDocumentCode($dataIsolation, $documentCode);
    }

    /**
     * 准备创建.
     */
    private function prepareForCreation(KnowledgeBaseDocumentEntity $documentEntity, ?DocumentFileVO $documentFile = null): void
    {
        if (empty($documentEntity->getName())) {
            ExceptionBuilder::throw(FlowErrorCode::ValidateFailed, '文档名称不能为空');
        }

        if (empty($documentEntity->getKnowledgeBaseCode())) {
            ExceptionBuilder::throw(FlowErrorCode::ValidateFailed, '知识库编码不能为空');
        }

        if (empty($documentEntity->getCreatedUid())) {
            ExceptionBuilder::throw(FlowErrorCode::ValidateFailed, '创建者不能为空');
        }

        // 设置默认值
        if (! $documentEntity->issetCreatedAt()) {
            $documentEntity->setCreatedAt(date('Y-m-d H:i:s'));
        }

        $documentEntity->setUpdatedAt($documentEntity->getCreatedAt());
        $documentEntity->setUpdatedUid($documentEntity->getCreatedUid());
        $documentEntity->setDocType(DocType::fromExtension($documentFile?->getFileLink()->getUrl() ?? '')->value);
        $documentEntity->setSyncStatus(0); // 0 表示未同步
    }

    /**
     * 准备更新.
     */
    private function prepareForUpdate(KnowledgeBaseDocumentEntity $newDocument, KnowledgeBaseDocumentEntity $oldDocument): void
    {
        // 不允许修改的字段保持原值
        $newDocument->setId($oldDocument->getId());
        $newDocument->setCode($oldDocument->getCode());
        $newDocument->setKnowledgeBaseCode($oldDocument->getKnowledgeBaseCode());
        $newDocument->setCreatedAt($oldDocument->getCreatedAt());
        $newDocument->setCreatedUid($oldDocument->getCreatedUid());
        $newDocument->setDocType($oldDocument->getDocType());

        // 更新时间
        $newDocument->setUpdatedAt(date('Y-m-d H:i:s'));

        // 如果文档内容或者配置变化，重置同步状态
        if ($this->isContentOrConfigChanged($newDocument, $oldDocument)) {
            $newDocument->setSyncStatus(0); // 0 表示未同步
            $newDocument->setSyncStatusMessage('');
            $newDocument->setSyncTimes(0);
        } else {
            $newDocument->setSyncStatus($oldDocument->getSyncStatus());
            $newDocument->setSyncStatusMessage($oldDocument->getSyncStatusMessage());
            $newDocument->setSyncTimes($oldDocument->getSyncTimes());
        }
    }

    /**
     * 判断文档内容或配置是否变化.
     */
    private function isContentOrConfigChanged(KnowledgeBaseDocumentEntity $newDocument, KnowledgeBaseDocumentEntity $oldDocument): bool
    {
        // 检查可能影响向量索引的字段是否变化
        return $newDocument->getDocMetadata() != $oldDocument->getDocMetadata()
            || $newDocument->getEmbeddingModel() !== $oldDocument->getEmbeddingModel()
            || $newDocument->getVectorDb() !== $oldDocument->getVectorDb()
            || $newDocument->getEmbeddingConfig() != $oldDocument->getEmbeddingConfig()
            || $newDocument->getRetrieveConfig() != $oldDocument->getRetrieveConfig();
    }
}
