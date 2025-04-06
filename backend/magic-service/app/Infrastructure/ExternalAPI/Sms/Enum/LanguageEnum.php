<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\ExternalAPI\Sms\Enum;

enum LanguageEnum: string
{
    /**
     * 简中.
     */
    case ZH_CN = 'zh_CN';

    /**
     * 美式英语.
     */
    case EN_US = 'en_US';

    /**
     * 印尼语.
     */
    case ID_ID = 'id_ID';
}
