<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\KnowledgeBase\Service;

use App\Domain\KnowledgeBase\Entity\KnowledgeBaseDocumentEntity;
use App\Domain\KnowledgeBase\Entity\KnowledgeBaseEntity;
use App\Domain\KnowledgeBase\Entity\KnowledgeBaseFragmentEntity;
use App\Domain\KnowledgeBase\Entity\ValueObject\KnowledgeBaseDataIsolation;
use App\Domain\KnowledgeBase\Entity\ValueObject\KnowledgeSyncStatus;
use App\Domain\KnowledgeBase\Entity\ValueObject\Query\KnowledgeBaseFragmentQuery;
use App\Domain\KnowledgeBase\Event\KnowledgeBaseFragmentRemovedEvent;
use App\Domain\KnowledgeBase\Event\KnowledgeBaseFragmentSavedEvent;
use App\Domain\KnowledgeBase\Repository\Facade\KnowledgeFragmentRepositoryInterface;
use App\ErrorCode\FlowErrorCode;
use App\Infrastructure\Core\Exception\ExceptionBuilder;
use App\Infrastructure\Core\ValueObject\Page;
use Dtyq\AsyncEvent\AsyncEventUtil;

readonly class KnowledgeBaseFragmentDomainService
{
    public function __construct(
        private KnowledgeFragmentRepositoryInterface $magicFlowKnowledgeFragmentRepository,
    ) {
    }

    /**
     * @return array{total: int, list: array<KnowledgeBaseFragmentEntity>}
     */
    public function queries(KnowledgeBaseDataIsolation $dataIsolation, KnowledgeBaseFragmentQuery $query, Page $page): array
    {
        return $this->magicFlowKnowledgeFragmentRepository->queries($dataIsolation, $query, $page);
    }

    public function show(KnowledgeBaseDataIsolation $dataIsolation, int $id, bool $selectForUpdate = false, bool $throw = true): ?KnowledgeBaseFragmentEntity
    {
        $magicFlowKnowledgeFragmentEntity = $this->magicFlowKnowledgeFragmentRepository->getById($dataIsolation, $id, $selectForUpdate);
        if (empty($magicFlowKnowledgeFragmentEntity) && $throw) {
            ExceptionBuilder::throw(FlowErrorCode::KnowledgeValidateFailed, "[{$id}] 不存在");
        }
        return $magicFlowKnowledgeFragmentEntity;
    }

    public function save(
        KnowledgeBaseDataIsolation $dataIsolation,
        KnowledgeBaseEntity $knowledgeBaseEntity,
        KnowledgeBaseDocumentEntity $knowledgeBaseDocumentEntity,
        KnowledgeBaseFragmentEntity $savingMagicFlowKnowledgeFragmentEntity
    ): KnowledgeBaseFragmentEntity {
        $savingMagicFlowKnowledgeFragmentEntity->setKnowledgeCode($knowledgeBaseEntity->getCode());
        $savingMagicFlowKnowledgeFragmentEntity->setDocumentCode($knowledgeBaseDocumentEntity->getCode());

        // 如果有业务id，并且业务 ID 存在，也可以相当于更新
        $magicFlowKnowledgeFragmentEntity = null;
        if (! empty($savingMagicFlowKnowledgeFragmentEntity->getBusinessId()) && empty($savingMagicFlowKnowledgeFragmentEntity->getId())) {
            $magicFlowKnowledgeFragmentEntity = $this->magicFlowKnowledgeFragmentRepository->getByBusinessId($dataIsolation, $savingMagicFlowKnowledgeFragmentEntity->getKnowledgeCode(), $savingMagicFlowKnowledgeFragmentEntity->getBusinessId());
            if (! is_null($magicFlowKnowledgeFragmentEntity)) {
                $savingMagicFlowKnowledgeFragmentEntity->setId($magicFlowKnowledgeFragmentEntity->getId());
            }
        }

        if ($savingMagicFlowKnowledgeFragmentEntity->shouldCreate()) {
            $savingMagicFlowKnowledgeFragmentEntity->prepareForCreation();
            $magicFlowKnowledgeFragmentEntity = $savingMagicFlowKnowledgeFragmentEntity;
        } else {
            $magicFlowKnowledgeFragmentEntity = $magicFlowKnowledgeFragmentEntity ?? $this->magicFlowKnowledgeFragmentRepository->getById($dataIsolation, $savingMagicFlowKnowledgeFragmentEntity->getId());
            if (empty($magicFlowKnowledgeFragmentEntity)) {
                ExceptionBuilder::throw(FlowErrorCode::KnowledgeValidateFailed, "[{$savingMagicFlowKnowledgeFragmentEntity->getId()}] 没有找到");
            }
            // 如果没有变化，就不需要更新了
            if (! $magicFlowKnowledgeFragmentEntity->hasModify($savingMagicFlowKnowledgeFragmentEntity)) {
                return $magicFlowKnowledgeFragmentEntity;
            }

            $savingMagicFlowKnowledgeFragmentEntity->prepareForModification($magicFlowKnowledgeFragmentEntity);
        }

        $magicFlowKnowledgeFragmentEntity = $this->magicFlowKnowledgeFragmentRepository->save($dataIsolation, $magicFlowKnowledgeFragmentEntity);

        $event = new KnowledgeBaseFragmentSavedEvent($knowledgeBaseEntity, $magicFlowKnowledgeFragmentEntity);
        $event->setIsSync(true);
        AsyncEventUtil::dispatch($event);

        return $magicFlowKnowledgeFragmentEntity;
    }

    public function showByBusinessId(KnowledgeBaseDataIsolation $dataIsolation, string $knowledgeCode, string $businessId): KnowledgeBaseFragmentEntity
    {
        $magicFlowKnowledgeFragmentEntity = $this->magicFlowKnowledgeFragmentRepository->getByBusinessId($dataIsolation, $knowledgeCode, $businessId);
        if (empty($magicFlowKnowledgeFragmentEntity)) {
            ExceptionBuilder::throw(FlowErrorCode::KnowledgeValidateFailed, "[{$businessId}] 不存在");
        }
        return $magicFlowKnowledgeFragmentEntity;
    }

    public function destroy(KnowledgeBaseDataIsolation $dataIsolation, KnowledgeBaseEntity $knowledgeBaseEntity, KnowledgeBaseFragmentEntity $knowledgeBaseFragmentEntity): void
    {
        $this->magicFlowKnowledgeFragmentRepository->destroy($dataIsolation, $knowledgeBaseFragmentEntity);
        AsyncEventUtil::dispatch(new KnowledgeBaseFragmentRemovedEvent($knowledgeBaseEntity, $knowledgeBaseFragmentEntity));
    }

    public function batchDestroyByPointIds(KnowledgeBaseDataIsolation $dataIsolation, KnowledgeBaseEntity $knowledgeEntity, array $pointIds): void
    {
        $this->magicFlowKnowledgeFragmentRepository->fragmentBatchDestroyByPointIds($dataIsolation, $knowledgeEntity->getCode(), $pointIds);
    }

    /**
     * @return array<string, KnowledgeSyncStatus>
     */
    public function getFinalSyncStatusByDocumentCodes(KnowledgeBaseDataIsolation $dataIsolation, array $documentCodes): array
    {
        return $this->magicFlowKnowledgeFragmentRepository->getFinalSyncStatusByDocumentCodes($dataIsolation, $documentCodes);
    }
}
