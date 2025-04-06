<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\Chat\Service;

use App\Domain\Chat\DTO\Message\ChatMessage\RecordingSummaryStreamMessage;
use App\Domain\Contact\Entity\ValueObject\DataIsolation;

/**
 * 处理控制消息相关.
 */
class MagicRecordingSummaryDomainService extends AbstractDomainService
{
    public function createStreamMessage(
        DataIsolation $dataIsolation,
        RecordingSummaryStreamMessage $streamMessage
    ) {
        $this->magicStreamMessageRepository->create($streamMessage->toArray());
    }

    public function getStreamMessageByAppMessageId(string $getAppMessageId): ?RecordingSummaryStreamMessage
    {
        return $this->magicStreamMessageRepository->getByAppMessageId($getAppMessageId);
    }

    public function updateStreamMessage(DataIsolation $dataIsolation, RecordingSummaryStreamMessage $streamMessage)
    {
        $this->magicStreamMessageRepository->updateById($streamMessage->getId(), $streamMessage->toArray());
    }

    public function getStreamsByGtUpdatedAt(string $updatedAt, string $lastId): array
    {
        return $this->magicStreamMessageRepository->getByGtUpdatedAt($updatedAt, $lastId);
    }

    public function clearSeqMessageIdsByStreamIds(array $ids)
    {
        $this->magicStreamMessageRepository->clearSeqMessageIdsByStreamIds($ids);
    }
}
