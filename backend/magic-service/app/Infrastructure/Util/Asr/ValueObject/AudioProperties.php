<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\Util\Asr\ValueObject;

use JsonSerializable;

/**
 * AudioProperties 类.
 */
class AudioProperties implements JsonSerializable
{
    /** @var int 默认采样率（Hz） */
    public const int DEFAULT_SAMPLE_RATE = 16000;

    /** @var int 默认位深度 */
    public const int DEFAULT_BITS_PER_SAMPLE = 16;

    /** @var int 默认通道数（单声道） */
    public const int DEFAULT_CHANNELS = 1;

    /** @var int 双声道通道数 */
    public const int STEREO_CHANNELS = 2;

    /** @var string 默认音频格式 */
    public const string DEFAULT_AUDIO_FORMAT = 'wav';

    /** @var string 默认音频编码 */
    public const string DEFAULT_AUDIO_CODEC = 'pcm';

    public const Language DEFAULT_LANGUAGE = Language::ZH_CN;

    /**
     * AudioProperties 构造函数.
     *
     * @param Language $language 识别语言，默认为 'zh_CN'（中文）
     * @param int $sampleRate 音频采样率，默认为 16000 Hz
     * @param string $audioFormat 音频格式，默认为 'wav'
     * @param string $audioCodec 音频编码，默认为 'pcm'
     * @param int $bitsPerSample 采样位数，默认为 16 位
     * @param int $channels 音频通道数，默认为 1（单声道）
     */
    public function __construct(
        private Language $language = self::DEFAULT_LANGUAGE,
        private int $sampleRate = self::DEFAULT_SAMPLE_RATE,
        private string $audioFormat = self::DEFAULT_AUDIO_FORMAT,
        private string $audioCodec = self::DEFAULT_AUDIO_CODEC,
        private int $bitsPerSample = self::DEFAULT_BITS_PER_SAMPLE,
        private int $channels = self::DEFAULT_CHANNELS
    ) {
    }

    /**
     * 获取识别语言.
     */
    public function getLanguage(): Language
    {
        return $this->language;
    }

    /**
     * 设置识别语言.
     */
    public function setLanguage(Language $language): self
    {
        $this->language = $language;
        return $this;
    }

    /**
     * 获取音频采样率.
     */
    public function getSampleRate(): int
    {
        return $this->sampleRate;
    }

    /**
     * 设置音频采样率.
     */
    public function setSampleRate(int $sampleRate): self
    {
        $this->sampleRate = $sampleRate;
        return $this;
    }

    /**
     * 获取音频格式.
     */
    public function getAudioFormat(): string
    {
        return $this->audioFormat;
    }

    /**
     * 设置音频格式.
     */
    public function setAudioFormat(string $audioFormat): self
    {
        $this->audioFormat = $audioFormat;
        return $this;
    }

    /**
     * 获取音频编码
     */
    public function getAudioCodec(): string
    {
        return $this->audioCodec;
    }

    /**
     * 设置音频编码
     */
    public function setAudioCodec(string $audioCodec): self
    {
        $this->audioCodec = $audioCodec;
        return $this;
    }

    /**
     * 获取采样位数.
     */
    public function getBitsPerSample(): int
    {
        return $this->bitsPerSample;
    }

    /**
     * 设置采样位数.
     */
    public function setBitsPerSample(int $bitsPerSample): self
    {
        $this->bitsPerSample = $bitsPerSample;
        return $this;
    }

    /**
     * 获取音频通道数.
     */
    public function getChannels(): int
    {
        return $this->channels;
    }

    /**
     * 设置音频通道数.
     */
    public function setChannels(int $channels): self
    {
        $this->channels = $channels;
        return $this;
    }

    /**
     * 使用音频分析结果创建新的 AudioProperties 实例.
     *
     * @param AudioProperties $analyzedOptions 分析后的音频选项
     */
    public function withAudioAnalysis(AudioProperties $analyzedOptions): self
    {
        $clone = clone $this;
        $clone->audioFormat = $analyzedOptions->getAudioFormat();
        $clone->sampleRate = $analyzedOptions->getSampleRate();
        $clone->audioCodec = $analyzedOptions->getAudioCodec();
        $clone->bitsPerSample = $analyzedOptions->getBitsPerSample();
        $clone->channels = $analyzedOptions->getChannels();
        return $clone;
    }

    /**
     * 将对象转换为数组.
     */
    public function toArray(): array
    {
        return [
            'language' => $this->language,
            'sampleRate' => $this->sampleRate,
            'audioFormat' => $this->audioFormat,
            'audioCodec' => $this->audioCodec,
            'bitsPerSample' => $this->bitsPerSample,
            'channels' => $this->channels,
        ];
    }

    /**
     * 实现 JsonSerializable 接口的方法.
     */
    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
