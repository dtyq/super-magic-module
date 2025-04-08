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
use App\Domain\KnowledgeBase\Entity\ValueObject\KnowledgeFragmentQuery;
use App\Domain\KnowledgeBase\Entity\ValueObject\KnowledgeSyncStatus;
use App\Domain\KnowledgeBase\Entity\ValueObject\Query\KnowledgeBaseFragmentQuery;
use App\Domain\KnowledgeBase\Event\KnowledgeBaseFragmentRemovedEvent;
use App\Domain\KnowledgeBase\Event\KnowledgeBaseFragmentSavedEvent;
use App\Domain\KnowledgeBase\Repository\Facade\KnowledgeFragmentRepositoryInterface;
use App\ErrorCode\FlowErrorCode;
use App\Infrastructure\Core\Exception\ExceptionBuilder;
use App\Infrastructure\Core\ValueObject\Page;
use Dtyq\AsyncEvent\AsyncEventUtil;
use Hyperf\DbConnection\Db;

readonly class KnowledgeBaseFragmentDomainService
{
    public function __construct(
        private KnowledgeFragmentRepositoryInterface $magicFlowKnowledgeFragmentRepository,
    ) {
    }

    /**
     * todo 要移走，不能在这里
     * 片段检索.
     * @return KnowledgeBaseFragmentEntity[]
     */
    public function fragmentQuery(KnowledgeBaseDataIsolation $dataIsolation, KnowledgeBaseEntity $knowledgeEntity, KnowledgeFragmentQuery $knowledgeFragmentQuery): array
    {
        $points = $knowledgeEntity->getVectorDBDriver()->queryPoints(
            $knowledgeEntity->getCollectionName(),
            $knowledgeFragmentQuery->getLimit(),
            $knowledgeFragmentQuery->getMetadataFilter(),
        );
        $result = [];
        foreach ($points as $point) {
            $result[] = KnowledgeBaseFragmentEntity::createByPointInfo($point, $knowledgeEntity->getCode());
        }
        return $result;
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

    public function destroyByMetadataFilter(KnowledgeBaseDataIsolation $dataIsolation, KnowledgeBaseEntity $magicFlowKnowledgeEntity, array $metadataFilter): void
    {
        if (empty($metadataFilter)) {
            return;
        }
        // 先搜索
        $knowledgeFragmentQuery = new KnowledgeFragmentQuery();
        $knowledgeFragmentQuery->setMetadataFilter($metadataFilter);
        // 应该不会超过 1000 吧 todo 这里迟点处理一下
        $knowledgeFragmentQuery->setLimit(1000);
        $fragments = $this->fragmentQuery($dataIsolation, $magicFlowKnowledgeEntity, $knowledgeFragmentQuery);
        if (empty($fragments)) {
            return;
        }

        $pointIds = [];
        foreach ($fragments as $fragment) {
            $pointIds[] = $fragment->getPointId();
        }

        Db::transaction(function () use ($dataIsolation, $magicFlowKnowledgeEntity, $metadataFilter, $pointIds) {
            $this->batchDestroyByPointIds(
                $dataIsolation,
                $magicFlowKnowledgeEntity,
                $pointIds
            );
            // 还需要删除相同 point_id 的内容，因为目前允许重复
            $magicFlowKnowledgeEntity->getVectorDBDriver()->removeByFilter(
                $magicFlowKnowledgeEntity->getCollectionName(),
                $metadataFilter,
            );
        });
    }

    public function destroy(KnowledgeBaseDataIsolation $dataIsolation, KnowledgeBaseEntity $knowledgeBaseEntity, KnowledgeBaseFragmentEntity $knowledgeBaseFragmentEntity): void
    {
        $this->magicFlowKnowledgeFragmentRepository->destroy($dataIsolation, $knowledgeBaseFragmentEntity);
        AsyncEventUtil::dispatch(new KnowledgeBaseFragmentRemovedEvent($knowledgeBaseEntity, $knowledgeBaseFragmentEntity));
    }

    public function batchDestroy(KnowledgeBaseDataIsolation $dataIsolation, KnowledgeBaseEntity $knowledgeEntity, array $fragmentIds): void
    {
        $this->magicFlowKnowledgeFragmentRepository->fragmentBatchDestroy($dataIsolation, $knowledgeEntity->getCode(), $fragmentIds);
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
