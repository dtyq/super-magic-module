<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\Util\Asr\Util;

use App\Infrastructure\Util\Asr\ValueObject\AudioProperties;
use getID3;
use Hyperf\Logger\LoggerFactory;
use Psr\Log\LoggerInterface;

class AudioFileAnalyzer
{
    protected LoggerInterface $logger;

    public function __construct(
        protected getID3 $getID3,
        LoggerFactory $loggerFactory
    ) {
        $this->logger = $loggerFactory->get(static::class);
    }

    /**
     * 分析音频文件并返回参数.
     *
     * @param string $audioFilePath 音频文件路径
     * @return AudioProperties 音频参数数组
     */
    public function analyzeAudioFile(string $audioFilePath): AudioProperties
    {
        // 分析音频文件逻辑...
        $fileInfo = $this->getID3->analyze($audioFilePath);

        // 创建并返回 AudioProperties 对象
        $sampleRate = $fileInfo['audio']['sample_rate'] ?? AudioProperties::DEFAULT_SAMPLE_RATE;
        $audioFormat = $fileInfo['fileformat'] ?? 'wav';
        $bitsPerSample = $fileInfo['audio']['bits_per_sample'] ?? AudioProperties::DEFAULT_BITS_PER_SAMPLE;
        if (isset($fileInfo['audio']['channels'])) {
            if (intval($fileInfo['audio']['channels']) > AudioProperties::DEFAULT_CHANNELS) {
                $channels = AudioProperties::STEREO_CHANNELS;
            } else {
                $channels = AudioProperties::DEFAULT_CHANNELS;
            }
        } else {
            $channels = AudioProperties::DEFAULT_CHANNELS;
        }
        $audioProperties = new AudioProperties(
            sampleRate: (int) $sampleRate,
            audioFormat: (string) $audioFormat,
            audioCodec: $this->determineCodec($fileInfo['audio']['dataformat'] ?? ''),
            bitsPerSample: (int) $bitsPerSample,
            channels: (int) $channels
        );

        $this->logger->info('音频文件分析完成,音频信息：', [
            'sampleRate' => $audioProperties->getSampleRate(),
            'audioFormat' => $audioProperties->getAudioFormat(),
            'audioCodec' => $audioProperties->getAudioCodec(),
            'bitsPerSample' => $audioProperties->getBitsPerSample(),
            'channels' => $audioProperties->getChannels(),
        ]);
        return $audioProperties;
    }

    /**
     * 确定音频编码格式.
     */
    private function determineCodec(string $dataFormat): string
    {
        switch ($dataFormat) {
            case 'opus':
                return 'opus';
            case 'pcm':
            default:
                return 'raw'; // 默认为 raw(pcm)
        }
    }
}
