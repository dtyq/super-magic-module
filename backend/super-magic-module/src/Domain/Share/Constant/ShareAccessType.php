<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Domain\Share\Constant;

/**
 * 分享访问类型枚举.
 */
enum ShareAccessType: int
{
    case SelfOnly = 1;                // 仅自己可访问
    case OrganizationInternal = 2;    // 组织内部可访问
    case SpecificTarget = 3;          // 指定部门/成员可访问
    case Internet = 4;                // 互联网可访问(需要链接)

    /**
     * 获取分享类型的描述.
     */
    public function getDescription(): string
    {
        return match ($this) {
            self::SelfOnly => '仅自己可访问',
            self::OrganizationInternal => '组织内部可访问',
            self::SpecificTarget => '指定部门/成员可访问',
            self::Internet => '互联网可访问',
        };
    }

    /**
     * 检查是否需要密码保护.
     */
    public function needsPassword(): bool
    {
        return $this === self::Internet;
    }

    /**
     * 检查是否需要指定目标.
     */
    public function needsTargets(): bool
    {
        return $this === self::SpecificTarget;
    }
}
