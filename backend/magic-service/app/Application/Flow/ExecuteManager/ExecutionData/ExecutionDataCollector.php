<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\Flow\ExecuteManager\ExecutionData;

class ExecutionDataCollector
{
    public const int MAX_COUNT = 10000;

    public static array $executionList = [];

    public static function add(ExecutionData $executionData): void
    {
        self::$executionList[$executionData->getUniqueId()] = $executionData;
    }

    public static function get(string $uniqueId): ?ExecutionData
    {
        return self::$executionList[$uniqueId] ?? null;
    }

    public static function remove(string $uniqueId): void
    {
        unset(self::$executionList[$uniqueId]);
    }
}
