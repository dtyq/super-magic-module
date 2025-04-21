<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\Chat\Entity\ValueObject;

enum SpecialAICode: string
{
    /**
     * 超级麦吉.
     */
    case SuperMagic = 'SUPER_MAGIC';

    public static function isValid(string $code): bool
    {
        return in_array($code, array_column(self::cases(), 'value'));
    }
}
