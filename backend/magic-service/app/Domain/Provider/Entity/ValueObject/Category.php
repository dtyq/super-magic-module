<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\Provider\Entity\ValueObject;

enum Category: string
{
    case LLM = 'llm';
    case VLM = 'vlm';

    public function label(): string
    {
        return match ($this) {
            self::LLM => '大模型',
            self::VLM => '视觉模型',
        };
    }
}
