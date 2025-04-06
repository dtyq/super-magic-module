<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\Chat\Crontab;

use App\Domain\Chat\Service\MagicChatDomainService;
use App\Domain\Chat\Service\MagicRecordingSummaryDomainService;
use Carbon\Carbon;
use Hyperf\Crontab\Annotation\Crontab;
use Hyperf\DbConnection\Db;
use Psr\Log\LoggerInterface;
use Throwable;

#[Crontab(rule: '*/1 * * * *', name: 'ClearMagicMessageCrontab', singleton: true, mutexExpires: 600, onOneServer: true, callback: 'execute', memo: '清理magicMessage')]
readonly class ClearMagicMessageCrontab
{
    public function __construct(
        private MagicChatDomainService $magicChatDomainService,
        private MagicRecordingSummaryDomainService $magicStreamDomainService,
        private LoggerInterface $logger,
    ) {
    }

    public function execute(): void
    {
        $this->logger->info('ClearMagicMessageCrontab start');
        $time = Carbon::now()->subMinutes(30)->toDateTimeString();
        $this->clearMagicMessage($time);
        $this->logger->info('ClearMagicMessageCrontab success');
    }

    public function clearMagicMessage(string $time): void
    {
        // 首先遍历stream表，找出十分钟内更新过的stream
        $lastId = '0';
        while (true) {
            $this->logger->info(sprintf('ClearMagicMessageCrontab time: %s, lastId: %s', $time, $lastId));
            $streams = $this->magicStreamDomainService->getStreamsByGtUpdatedAt($time, $lastId);
            if (empty($streams)) {
                break;
            }
            $seqIds = [];
            foreach ($streams as $stream) {
                $seqIds[] = $stream->getSeqMessageIds();
                $lastId = $stream->getId();
            }
            // 避免循环中调用 array_merge 造成性能问题
            $seqIds = array_merge(...$seqIds);
            $seqIds = array_values(array_filter(array_unique($seqIds)));
            $seqIdChunks = array_chunk($seqIds, 100);
            try {
                Db::beginTransaction();
                foreach ($seqIdChunks as $seqIdChunk) {
                    // 根据seqId查询出magicMessageId
                    $seqMessages = $this->magicChatDomainService->getSeqMessageByIds($seqIdChunk);
                    $magicMessageIds = array_column($seqMessages, 'magic_message_id');
                    if ($magicMessageIds) {
                        $this->magicChatDomainService->deleteChatMessageByMagicMessageIds($magicMessageIds);
                    }
                    // 获取magic_message_id，删除chat_message
                    $extras = array_column($seqMessages, 'extra');
                    $topicIds = array_map(static function ($extra) {
                        $extra = json_decode($extra, true);
                        if (! empty($extra['topic_id'])) {
                            return $extra['topic_id'];
                        }
                        return '';
                    }, $extras);
                    $this->magicChatDomainService->deleteTopicByIds($topicIds);
                    // 清理seq
                    $this->magicChatDomainService->deleteSeqMessageByIds($seqIdChunk);
                }
                $this->magicStreamDomainService->clearSeqMessageIdsByStreamIds(array_column($streams, 'id'));
                Db::commit();
            } catch (Throwable $e) {
                Db::rollBack();
                $this->logger->error('ClearMagicMessageCrontab error', ['error' => $e->getMessage()]);
            }
        }
    }
}
