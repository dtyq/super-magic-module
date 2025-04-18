<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\ExternalAPI\ImageGenerateAPI\Request;

class MidjourneyModelRequest extends ImageGenerateRequest
{
    // 生成的图片数量(没有用，但是必须要带)

    // 比例
    private string $ratio = '1:1';

    public function getGenerateNum(): int
    {
        return $this->generateNum;
    }

    public function setGenerateNum(int $generateNum): void
    {
        $this->generateNum = $generateNum;
    }

    public function getRatio(): string
    {
        return $this->ratio;
    }

    public function setRatio(string $ratio): void
    {
        $this->ratio = $ratio;
    }
}
