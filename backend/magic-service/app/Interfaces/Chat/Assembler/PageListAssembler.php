<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Interfaces\Chat\Assembler;

// 分页组织器
class PageListAssembler
{
    public static function pageByMysql(array $data, string $requestPageToken, bool $hasMore = false): array
    {
        if ($hasMore) {
            $pageToken = (string) (count($data) + (int) $requestPageToken);
        } else {
            $pageToken = '';
        }
        return [
            'items' => $data,
            'has_more' => $hasMore,
            'page_token' => $pageToken,
        ];
    }

    public static function pageByElasticSearch(array $data, string $requestPageToken, bool $hasMore = false): array
    {
        return [
            'items' => $data,
            'has_more' => $hasMore,
            'page_token' => $requestPageToken,
        ];
    }
}
