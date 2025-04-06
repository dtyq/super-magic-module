<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\Util\Asr;

use App\Infrastructure\Util\Asr\Config\ConfigInterface;
use App\Infrastructure\Util\Asr\Config\VolcengineConfig;
use App\Infrastructure\Util\Asr\Driver\DriverInterface;
use App\Infrastructure\Util\Asr\ValueObject\AsrPlatform;
use App\Infrastructure\Util\Asr\ValueObject\Language;
use Exception;

class AsrFacade
{
    /**
     * 使用指定的 ASR 平台识别音频文件.
     *
     * @param string $audioFilePath 音频文件路径
     * @param Language $language 语言，默认为 'zh_CN'
     * @throws Exception
     */
    public static function recognize(string $audioFilePath, Language $language = Language::ZH_CN, array $params = []): array
    {
        $platform = config('asr.default_platform');
        $config = self::getConfig($platform, $language);
        $driver = self::getDriver($platform, $config);

        return $driver->recognize($audioFilePath, $language, $params);
    }

    public static function recognizeVoice(string $audioFileUrl): array
    {
        $platform = config('asr.default_platform');
        $config = self::getConfig($platform, Language::ZH_CN);
        $driver = self::getDriver($platform, $config);

        return $driver->recognizeVoice($audioFileUrl);
    }

    /**
     * 获取配置对象
     *
     * @throws Exception
     */
    private static function getConfig(AsrPlatform $platform, Language $language): ConfigInterface
    {
        return match ($platform) {
            AsrPlatform::Volcengine => new VolcengineConfig(
                config('asr.volcengine.app_id'),
                config('asr.volcengine.token'),
                $language,
                config('asr.volcengine.hot_words') ?? [],
                config('asr.volcengine.replacement_words') ?? [],
            ),
        };
    }

    /**
     * 获取 ASR 驱动.
     *
     * @throws Exception
     */
    private static function getDriver(AsrPlatform $platform, ConfigInterface $config): DriverInterface
    {
        return match ($platform) {
            /* @phpstan-ignore-next-line */
            AsrPlatform::Volcengine => Asr::volcengine($config),
        };
    }
}
