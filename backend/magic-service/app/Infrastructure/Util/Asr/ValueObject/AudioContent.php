<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\Util\Asr\ValueObject;

use App\Infrastructure\Core\AbstractValueObject;

class AudioContent extends AbstractValueObject
{
    protected string $duration = '';

    protected string $text = '';

    protected string $speaker = '';

    protected string $start_time = '';

    protected string $end_time = '';

    public function getDuration(): string
    {
        return $this->duration;
    }

    public function setDuration(string $duration): void
    {
        $this->duration = $duration;
    }

    public function getText(): string
    {
        return $this->text;
    }

    public function setText(string $text): void
    {
        $this->text = $text;
    }

    public function getSpeaker(): string
    {
        return $this->speaker;
    }

    public function setSpeaker(string $speaker): void
    {
        $this->speaker = $speaker;
    }

    public function getStartTime(): string
    {
        return $this->start_time;
    }

    public function setStartTime(string $start_time): void
    {
        $this->start_time = $start_time;
    }

    public function getEndTime(): string
    {
        return $this->end_time;
    }

    public function setEndTime(string $end_time): void
    {
        $this->end_time = $end_time;
    }
}
