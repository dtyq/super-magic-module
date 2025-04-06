<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\Util\Asr\Config;

use App\ErrorCode\AsrErrorCode;
use App\Infrastructure\Core\Exception\ExceptionBuilder;
use App\Infrastructure\Util\Asr\ValueObject\Language;
use Hyperf\Codec\Json;

class VolcengineConfig implements ConfigInterface
{
    public function __construct(
        protected string $appId,
        protected string $token,
        protected Language $language = Language::ZH_CN,
        protected array $hotWordsConfig = [],
        protected array $replacementWordsConfig = [],
    ) {
        $this->validateConfig();
    }

    public function getAppId(): string
    {
        if (empty($this->appId)) {
            ExceptionBuilder::throw(AsrErrorCode::InvalidConfig, 'asr.config_error.invalid_config');
        }
        return $this->appId;
    }

    public function setAppId(string $appId): self
    {
        $this->appId = $appId;
        $this->validateConfig();
        return $this;
    }

    public function getToken(): string
    {
        if (empty($this->token)) {
            ExceptionBuilder::throw(AsrErrorCode::InvalidConfig, 'asr.config_error.invalid_config');
        }
        return $this->token;
    }

    public function setToken(string $token): self
    {
        $this->token = $token;
        $this->validateConfig();
        return $this;
    }

    public function getLanguage(): Language
    {
        return $this->language;
    }

    public function setLanguage(Language $language): self
    {
        $this->language = $language;
        $this->validateConfig();
        return $this;
    }

    public function getHotWordsConfig(): array
    {
        return $this->hotWordsConfig;
    }

    public function setHotWordsConfig(array $hotWordsConfig): void
    {
        $this->hotWordsConfig = $hotWordsConfig;
    }

    public function getReplacementWordsConfig(): array
    {
        return $this->replacementWordsConfig;
    }

    public function setReplacementWordsConfig(array $replacementWordsConfig): void
    {
        $this->replacementWordsConfig = $replacementWordsConfig;
    }

    public function toArray(): array
    {
        return [
            'appId' => $this->getAppId(),
            'token' => $this->getToken(),
            'language' => $this->getLanguage(),
        ];
    }

    public function jsonSerialize(): mixed
    {
        return Json::encode($this->toArray());
    }

    protected function validateConfig(): void
    {
        if (empty($this->appId) || empty($this->token)) {
            ExceptionBuilder::throw(AsrErrorCode::InvalidConfig, 'asr.config_error.invalid_config');
        }

        if (! in_array($this->language, [Language::ZH_CN, Language::EN_US, Language::ID_ID])) {
            ExceptionBuilder::throw(AsrErrorCode::InvalidConfig, 'asr.config_error.invalid_language');
        }
    }
}
