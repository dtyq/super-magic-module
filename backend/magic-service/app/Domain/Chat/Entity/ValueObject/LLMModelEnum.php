<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\Chat\Entity\ValueObject;

enum LLMModelEnum: string
{
    case GEMMA2_2B = 'gemma2-2b';
    case GPT_4O = 'gpt-4o';
    case GPT_41 = 'gpt-4.1';
    case DEEPSEEK_R1 = 'DeepSeek-R1';
    case DEEPSEEK_V3 = 'deepseek-v3';
}
