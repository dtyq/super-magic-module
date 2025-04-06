<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\Chat\Repository\Facade;

use App\Domain\Chat\DTO\Message\ChatMessage\RecordingSummaryStreamMessage;

interface MagicStreamMessageRepositoryInterface
{
    public function create(array $message): void;

    public function getByAppMessageId(string $appMessageId): ?RecordingSummaryStreamMessage;

    public function updateById(string $id, array $message): void;

    public function getByGtUpdatedAt(string $updatedAt, string $lastId): array;

    public function clearSeqMessageIdsByStreamIds(array $ids);
}
