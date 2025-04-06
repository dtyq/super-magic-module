<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\ExternalAPI\ImageGenerateAPI\Request;

class ImageGenerateRequest
{
    private string $width;

    private string $height;

    private string $prompt;

    private string $negativePrompt;

    private string $defaultNegativePrompt = '--no nsfw, nude, blurry, watermark, identifying mark, low resolution, mutated, lack of hierarchy';

    // 对mj无效
    private int $generateNum = 1;

    public function __construct(
        string $width = '',
        string $height = '',
        string $prompt = '',
        string $negativePrompt = ''
    ) {
        $this->width = $width;
        $this->height = $height;
        $this->prompt = $prompt;
        $this->negativePrompt = $negativePrompt;
    }

    public function getWidth(): string
    {
        return $this->width;
    }

    public function setWidth(string $width): void
    {
        $this->width = $width;
    }

    public function getHeight(): string
    {
        return $this->height;
    }

    public function setHeight(string $height): void
    {
        $this->height = $height;
    }

    public function getPrompt(): string
    {
        return $this->prompt;
    }

    public function setPrompt(string $prompt): void
    {
        $this->prompt = $prompt;
    }

    public function getNegativePrompt(): string
    {
        return $this->negativePrompt;
    }

    public function setNegativePrompt(string $negativePrompt): void
    {
        $this->negativePrompt = $negativePrompt;
    }

    public function getDefaultNegativePrompt(): string
    {
        return $this->defaultNegativePrompt;
    }

    public function setGenerateNum(int $generateNum): void
    {
        $this->generateNum = $generateNum;
    }

    public function getGenerateNum(): int
    {
        return $this->generateNum;
    }
}
