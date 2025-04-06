<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\ModelGateway\Entity\ValueObject;

/**
 * 支持的大模型枚举.
 */
enum MagicApiLLMEnum: string
{
    // local-gemma2-2b
    case LOCAL_GEMMA2_2B = 'local-gemma2-2b';
    case GPT_4O_MINI = 'gpt-4o-mini-global';
    case GPT_4O = 'gpt-4o-global';
    case DOU_BAO_PRO = 'Doubao-pro-32k';
}
