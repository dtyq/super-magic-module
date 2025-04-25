<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\Chat\DTO\Message;

use App\Domain\Chat\DTO\Message\StreamMessage\StreamOptions;
use Hyperf\Contract\Arrayable;
use JsonSerializable;

/**
 * 流式按字段推送 json 消息。
 * 用于大 json 的分次推送。比如深度搜索卡片消息。
 */
interface JsonStreamMessageInterface extends JsonSerializable, Arrayable
{
    // 消息是否是流式消息
    public function isStream(): bool;

    public function getStreamOptions(): ?StreamOptions;

    public function setStreamOptions(null|array|StreamOptions $streamOptions): static;

    /**
     * 获取本次需要流式推送的字段。
     * 支持一次推送多个字段的流式消息，如果 json 层级较深，使用 field_1.*.field_2 作为 key。 其中 * 是指数组的下标。
     * 服务端会缓存所有流式的数据，并在流式结束时一次性推送，以减少丢包的概率，提升消息完整性。
     * 例如：
     * [
     *     'users.0.name' => 'magic',
     *     'total' => 32,
     * ].
     */
    public function getThisTimeStreamMessages(): array;
}
