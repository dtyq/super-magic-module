<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\Util\Asr\Driver;

use App\Infrastructure\Util\Asr\ValueObject\Language;

interface DriverInterface
{
    /**
     * 执行语音识别.
     */
    public function recognize(string $audioFilePath, Language $language = Language::ZH_CN, array $params = []): array;

    /**
     * 录音文件识别.
     */
    public function recognizeVoice(string $audioFileUrl): array;
}
