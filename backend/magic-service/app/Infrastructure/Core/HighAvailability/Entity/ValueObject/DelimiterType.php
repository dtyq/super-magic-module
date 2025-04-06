<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\Core\HighAvailability\Entity\ValueObject;

use InvalidArgumentException;

/**
 * 分隔符类型枚举.
 */
enum DelimiterType: string
{
    /**
     * 模型类型+组织编码的分隔符.
     */
    case MODEL = '||';

    /**
     * 获取所有分隔符类型值数组.
     */
    public static function values(): array
    {
        return [
            self::MODEL->value,
        ];
    }

    /**
     * 检查是否是有效的分隔符类型.
     */
    public static function isValid(string $type): bool
    {
        return in_array($type, self::values(), true);
    }

    /**
     * 从字符串创建枚举实例.
     */
    public static function fromString(string $type): self
    {
        return match ($type) {
            self::MODEL->value => self::MODEL,
            default => throw new InvalidArgumentException("无效的分隔符类型: {$type}"),
        };
    }
}
