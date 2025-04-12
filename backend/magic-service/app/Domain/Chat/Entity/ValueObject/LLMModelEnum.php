<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\Chat\Entity\ValueObject;

enum LLMModelEnum: string
{
    case GEMMA2_2B = 'gemma2-2b';

    // 待移除，global是服务商的专属标识
    case GPT_4O_GLOBAL = 'gpt-4o-global';
    case GPT_4O = 'gpt-4o';

    // 待移除，global是服务商的专属标识
    case GPT_4O_MINI_GLOBAL = 'gpt-4o-mini-global';
    case DEEPSEEK_R1 = 'DeepSeek-R1';
    case DEEPSEEK_V3 = 'deepseek-v3';
}
