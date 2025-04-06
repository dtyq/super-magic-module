<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\Chat\Entity\ValueObject;

enum LLMModelEnum: string
{
    case GPT_4O_GLOBAL = 'gpt-4o-global';

    // 40-mini在搜索和生成关联问题这块非常弱智
    case GPT_4O_MINI_GLOBAL = 'gpt-4o-mini-global';

    // deepseek-r1
    case DEEPSEEK_R1 = 'DeepSeek-R1';
}
