<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\KnowledgeBase\Crontab;

use App\Domain\KnowledgeBase\Entity\ValueObject\KnowledgeBaseDataIsolation;
use App\Domain\KnowledgeBase\Entity\ValueObject\KnowledgeSyncStatus;
use App\Domain\KnowledgeBase\Entity\ValueObject\Query\KnowledgeBaseFragmentQuery;
use App\Domain\KnowledgeBase\Event\KnowledgeBaseFragmentSavedEvent;
use App\Domain\KnowledgeBase\Service\KnowledgeBaseDomainService;
use App\Domain\KnowledgeBase\Service\KnowledgeBaseFragmentDomainService;
use App\Infrastructure\Core\ValueObject\Page;
use Carbon\Carbon;
use Dtyq\AsyncEvent\AsyncEventUtil;

// #[Crontab(rule: '*/1 * * * *', name: 'MagicFlowKnowledgeFragmentCompensateCrontab', singleton: true, mutexExpires: 600, onOneServer: true, callback: 'execute', memo: '知识库片段补偿')]
readonly class MagicFlowKnowledgeFragmentCompensateCrontab
{
    public function __construct(
        private KnowledgeBaseDomainService $magicFlowKnowledgeDomainService,
    ) {
    }

    public function execute(): void
    {
        $query = new KnowledgeBaseFragmentQuery();
        $statues = array_map(fn (KnowledgeSyncStatus $status) => $status->value, KnowledgeSyncStatus::needCompensate());
        $query->setSyncStatuses($statues);
        $query->setMaxSyncTimes(3);
        $page = new Page(1, 100);
        $limitPage = 100;
        $knowledgeList = [];
        $dataIsolation = KnowledgeBaseDataIsolation::create();

        $fragmentDomainService = di(KnowledgeBaseFragmentDomainService::class);
        while (true) {
            $result = $fragmentDomainService->queries($dataIsolation, $query, $page);
            foreach ($result['list'] as $fragment) {
                switch ($fragment->getSyncStatus()) {
                    case KnowledgeSyncStatus::NotSynced:
                    case KnowledgeSyncStatus::Syncing:
                    case KnowledgeSyncStatus::Rebuilding:
                        // 可能是还在进行中，此处需要判断是否超过设定的最大时间，在 2 分钟内未同步的不补偿
                        if (Carbon::now()->diffInSeconds($fragment->getUpdatedAt()) < 60 * 2) {
                            continue 2;
                        }
                        break;
                    case KnowledgeSyncStatus::SyncFailed:
                        // 立即重试
                        break;
                    default:
                        continue 2;
                }
                $knowledge = $knowledgeList[$fragment->getKnowledgeCode()] ?? null;
                if (! $knowledge) {
                    $knowledge = $this->magicFlowKnowledgeDomainService->show($dataIsolation, $fragment->getKnowledgeCode());
                    $knowledgeList[$fragment->getKnowledgeCode()] = $knowledge;
                }
                if ($knowledge->getSyncStatus() !== KnowledgeSyncStatus::Synced) {
                    continue;
                }

                $fragmentEvent = new KnowledgeBaseFragmentSavedEvent($knowledge, $fragment);
                $fragmentEvent->setIsSync(true);
                AsyncEventUtil::dispatch($fragmentEvent);
            }
            if ($result['total'] < $limitPage) {
                break;
            }
            $page->setNextPage();
            if ($page->getPage() > $limitPage) {
                break;
            }
        }
    }
}
