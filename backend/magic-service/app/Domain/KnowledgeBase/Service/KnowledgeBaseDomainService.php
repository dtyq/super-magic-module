<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\KnowledgeBase\Service;

use App\Domain\Flow\Entity\ValueObject\Code;
use App\Domain\KnowledgeBase\Entity\KnowledgeBaseEntity;
use App\Domain\KnowledgeBase\Entity\KnowledgeBaseFragmentEntity;
use App\Domain\KnowledgeBase\Entity\ValueObject\DocumentFileVO;
use App\Domain\KnowledgeBase\Entity\ValueObject\KnowledgeBaseDataIsolation;
use App\Domain\KnowledgeBase\Entity\ValueObject\KnowledgeSyncStatus;
use App\Domain\KnowledgeBase\Entity\ValueObject\KnowledgeType;
use App\Domain\KnowledgeBase\Entity\ValueObject\Query\KnowledgeBaseFragmentQuery;
use App\Domain\KnowledgeBase\Entity\ValueObject\Query\KnowledgeBaseQuery;
use App\Domain\KnowledgeBase\Event\KnowledgeBaseFragmentSavedEvent;
use App\Domain\KnowledgeBase\Event\KnowledgeBaseRemovedEvent;
use App\Domain\KnowledgeBase\Event\KnowledgeBaseSavedEvent;
use App\Domain\KnowledgeBase\Repository\Facade\KnowledgeBaseRepositoryInterface;
use App\Domain\KnowledgeBase\Repository\Facade\KnowledgeFragmentRepositoryInterface;
use App\ErrorCode\FlowErrorCode;
use App\Infrastructure\Core\Exception\ExceptionBuilder;
use App\Infrastructure\Core\ValueObject\Page;
use Dtyq\AsyncEvent\AsyncEventUtil;
use Hyperf\DbConnection\Annotation\Transactional;
use Psr\SimpleCache\CacheInterface;

use function Hyperf\Coroutine\defer;

class KnowledgeBaseDomainService
{
    public function __construct(
        private readonly KnowledgeBaseRepositoryInterface $magicFlowKnowledgeRepository,
        private readonly KnowledgeFragmentRepositoryInterface $magicFlowKnowledgeFragmentRepository,
        private readonly CacheInterface $cache,
    ) {
    }

    /**
     * 保存知识库 - 基本信息.
     * @param array<DocumentFileVO> $files
     */
    public function save(KnowledgeBaseDataIsolation $dataIsolation, KnowledgeBaseEntity $savingMagicFlowKnowledgeEntity, array $files = []): KnowledgeBaseEntity
    {
        $savingMagicFlowKnowledgeEntity->setOrganizationCode($dataIsolation->getCurrentOrganizationCode());
        $savingMagicFlowKnowledgeEntity->setCreator($dataIsolation->getCurrentUserId());
        $create = false;
        if ($savingMagicFlowKnowledgeEntity->shouldCreate()) {
            $savingMagicFlowKnowledgeEntity->prepareForCreation();
            $magicFlowKnowledgeEntity = $savingMagicFlowKnowledgeEntity;
            $create = true;

            // 使用已经提前生成好的 code
            if (! empty($magicFlowKnowledgeEntity->getBusinessId())) {
                $tempCode = $this->getTempCodeByBusinessId($magicFlowKnowledgeEntity->getType(), $magicFlowKnowledgeEntity->getBusinessId());
                if (! empty($tempCode)) {
                    $magicFlowKnowledgeEntity->setCode($tempCode);
                }
            }
        } else {
            $magicFlowKnowledgeEntity = $this->magicFlowKnowledgeRepository->getByCode($dataIsolation, $savingMagicFlowKnowledgeEntity->getCode());
            if (empty($magicFlowKnowledgeEntity)) {
                ExceptionBuilder::throw(FlowErrorCode::KnowledgeValidateFailed, 'flow.common.not_found', ['label' => $savingMagicFlowKnowledgeEntity->getCode()]);
            }
            $savingMagicFlowKnowledgeEntity->prepareForModification($magicFlowKnowledgeEntity);
        }

        $magicFlowKnowledgeEntity = $this->magicFlowKnowledgeRepository->save($dataIsolation, $magicFlowKnowledgeEntity);

        $event = new KnowledgeBaseSavedEvent($magicFlowKnowledgeEntity, $create, $files);
        $event->setIsSync(true);
        AsyncEventUtil::dispatch($event);

        return $magicFlowKnowledgeEntity;
    }

    /**
     * 保存知识库 - 向量进度.
     */
    public function saveProcess(KnowledgeBaseDataIsolation $dataIsolation, KnowledgeBaseEntity $savingKnowledgeEntity): KnowledgeBaseEntity
    {
        $knowledgeEntity = $this->magicFlowKnowledgeRepository->getByCode($dataIsolation, $savingKnowledgeEntity->getCode());
        if (empty($knowledgeEntity)) {
            ExceptionBuilder::throw(FlowErrorCode::KnowledgeValidateFailed, 'common.not_found', ['label' => $savingKnowledgeEntity->getCode()]);
        }
        $savingKnowledgeEntity->prepareForModifyProcess($knowledgeEntity);
        return $this->magicFlowKnowledgeRepository->save($dataIsolation, $knowledgeEntity);
    }

    /**
     * 查询知识库列表.
     * @return array{total: int, list: array<KnowledgeBaseEntity>}
     */
    public function queries(KnowledgeBaseDataIsolation $dataIsolation, KnowledgeBaseQuery $query, Page $page): array
    {
        return $this->magicFlowKnowledgeRepository->queries($dataIsolation, $query, $page);
    }

    /**
     * 查询一个知识库.
     */
    public function show(KnowledgeBaseDataIsolation $dataIsolation, string $code, bool $checkCollection = false): KnowledgeBaseEntity
    {
        $magicFlowKnowledgeEntity = $this->magicFlowKnowledgeRepository->getByCode($dataIsolation, $code);
        if (empty($magicFlowKnowledgeEntity)) {
            ExceptionBuilder::throw(FlowErrorCode::KnowledgeValidateFailed, 'flow.common.not_found', ['label' => $code]);
        }
        if ($checkCollection) {
            $collection = $magicFlowKnowledgeEntity->getVectorDBDriver()->getCollection($magicFlowKnowledgeEntity->getCollectionName());
            if ($collection) {
                $magicFlowKnowledgeEntity->setCompletedCount($collection->pointsCount);
            }
            $query = new KnowledgeBaseFragmentQuery();
            $query->setKnowledgeCode($magicFlowKnowledgeEntity->getCode());
            $magicFlowKnowledgeEntity->setFragmentCount($this->magicFlowKnowledgeFragmentRepository->count($dataIsolation, $query));

            $query->setSyncStatus(KnowledgeSyncStatus::Synced->value);
            $magicFlowKnowledgeEntity->setExpectedCount($this->magicFlowKnowledgeFragmentRepository->count($dataIsolation, $query));
        }

        return $magicFlowKnowledgeEntity;
    }

    /**
     * 知识库是否存在.
     */
    public function exist(KnowledgeBaseDataIsolation $dataIsolation, string $code): bool
    {
        return $this->magicFlowKnowledgeRepository->exist($dataIsolation, $code);
    }

    /**
     * 删除知识库.
     */
    #[Transactional]
    public function destroy(KnowledgeBaseDataIsolation $dataIsolation, KnowledgeBaseEntity $magicFlowKnowledgeEntity): void
    {
        $this->magicFlowKnowledgeRepository->destroy($dataIsolation, $magicFlowKnowledgeEntity);
        $this->magicFlowKnowledgeFragmentRepository->destroyByKnowledgeCode($dataIsolation, $magicFlowKnowledgeEntity->getCode());
        AsyncEventUtil::dispatch(new KnowledgeBaseRemovedEvent($magicFlowKnowledgeEntity));
    }

    /**
     * 重建知识库 - 向量化.
     */
    public function rebuild(KnowledgeBaseDataIsolation $dataIsolation, string $code, bool $force = false): void
    {
        // 这里数据量大了之后，也需要改为队列进行

        // 版本号 +1，新增向量数据库，历史版本保留 n 天（定时任务删除）
        $magicFlowKnowledgeEntity = $this->magicFlowKnowledgeRepository->getByCode($dataIsolation, $code);
        if (empty($magicFlowKnowledgeEntity)) {
            ExceptionBuilder::throw(FlowErrorCode::KnowledgeValidateFailed, 'flow.common.not_found', ['label' => $code]);
        }
        $lastCollectionName = $magicFlowKnowledgeEntity->getCollectionName();

        $magicFlowKnowledgeEntity->setVersion($magicFlowKnowledgeEntity->getVersion() + 1);
        $magicFlowKnowledgeEntity->setSyncStatus(KnowledgeSyncStatus::Rebuilding);

        // 检查是否还具有重建中的数据，如果有，代表上一次还没完成
        $rebuildingQuery = new KnowledgeBaseFragmentQuery();
        $rebuildingQuery->setKnowledgeCode($magicFlowKnowledgeEntity->getCode());
        $rebuildingQuery->setSyncStatus(KnowledgeSyncStatus::Rebuilding->value);
        $rebuildingCount = $this->magicFlowKnowledgeFragmentRepository->count($dataIsolation, $rebuildingQuery);
        if (! $force && $rebuildingCount > 0) {
            ExceptionBuilder::throw(FlowErrorCode::KnowledgeValidateFailed, '上一次重建还未完成');
        }
        $this->magicFlowKnowledgeRepository->save($dataIsolation, $magicFlowKnowledgeEntity);

        defer(function () use ($dataIsolation, $magicFlowKnowledgeEntity, $lastCollectionName) {
            // 创建新的 collection，同步
            $event = new KnowledgeBaseSavedEvent($magicFlowKnowledgeEntity, false);
            $event->setIsSync(true);
            AsyncEventUtil::dispatch($event);

            // 获取同步结果
            $magicFlowKnowledgeEntity = $this->show($dataIsolation, $magicFlowKnowledgeEntity->getCode());
            if ($magicFlowKnowledgeEntity->getSyncStatus() !== KnowledgeSyncStatus::Synced) {
                return;
            }

            // 将旗下的所有片段状态置为重新同步
            $this->magicFlowKnowledgeFragmentRepository->rebuildByKnowledgeCode($dataIsolation, $magicFlowKnowledgeEntity->getCode());
            $query = new KnowledgeBaseFragmentQuery();
            $query->setKnowledgeCode($magicFlowKnowledgeEntity->getCode());
            $page = new Page(1, 1000);
            $limitPage = 100; // 10 万的片段应该错错有余
            while (true) {
                $result = $this->magicFlowKnowledgeFragmentRepository->queries($dataIsolation, $query, $page);
                $fragments = $result['list'];
                foreach ($fragments as $fragment) {
                    // 这里要按顺序，也进行同步
                    $fragmentEvent = new KnowledgeBaseFragmentSavedEvent($magicFlowKnowledgeEntity, $fragment);
                    $fragmentEvent->setIsSync(true);
                    AsyncEventUtil::dispatch($fragmentEvent);
                }
                if (empty($fragments) || count($fragments) < $page->getPageNum()) {
                    break;
                }
                $page->setNextPage();
                if ($page->getPage() > $limitPage) {
                    break;
                }
            }

            $newKnowledge = $this->show($dataIsolation, $magicFlowKnowledgeEntity->getCode(), true);
            // 预期数量达到即可
            if ($newKnowledge->getExpectedCount() === $newKnowledge->getCompletedCount()) {
                $magicFlowKnowledgeEntity->getVectorDBDriver()->removeCollection($lastCollectionName);
            }
        });
    }

    /**
     * 更新知识库状态
     */
    public function changeSyncStatus(KnowledgeBaseEntity|KnowledgeBaseFragmentEntity $entity): void
    {
        if ($entity instanceof KnowledgeBaseEntity) {
            $this->magicFlowKnowledgeRepository->changeSyncStatus($entity);
        }
        if ($entity instanceof KnowledgeBaseFragmentEntity) {
            $this->magicFlowKnowledgeFragmentRepository->changeSyncStatus($entity);
        }
    }

    public function updateKnowledgeBaseWordCount(KnowledgeBaseDataIsolation $dataIsolation, string $knowledgeCode, int $deltaWordCount): void
    {
        if ($deltaWordCount === 0) {
            return;
        }
        $this->magicFlowKnowledgeRepository->updateWordCount($dataIsolation, $knowledgeCode, $deltaWordCount);
    }

    public function generateTempCodeByBusinessId(KnowledgeType $knowledgeType, string $businessId): string
    {
        $key = 'knowledge-code:generate:' . $knowledgeType->value . ':' . $businessId;
        if ($this->cache->has($key)) {
            return $this->cache->get($key);
        }
        $code = Code::Knowledge->gen();
        $this->cache->set($key, $code, 7 * 24 * 60 * 60);
        return $code;
    }

    public function getTempCodeByBusinessId(KnowledgeType $knowledgeType, string $businessId): string
    {
        $key = 'knowledge-code:generate:' . $knowledgeType->value . ':' . $businessId;
        $value = $this->cache->get($key, '');
        $this->cache->delete($key);
        return $value;
    }

    /**
     * 获取知识库列表 - 专用于命令处理.
     * @return array<KnowledgeBaseEntity>
     */
    public function getKnowledgeBaseListForCommandProcess(KnowledgeBaseDataIsolation $dataIsolation, ?int $lastId = null, int $limit = 10): array
    {
        $query = new KnowledgeBaseQuery();
        if ($lastId !== null) {
            $query->setLastId($lastId);
        }
        $page = new Page(1, $limit);
        $result = $this->magicFlowKnowledgeRepository->queries($dataIsolation, $query, $page);
        return $result['list'] ?? [];
    }
}
