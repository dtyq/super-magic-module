<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\Util\Asr\ValueObject;

use App\Infrastructure\Core\AbstractValueObject;

class AudioResult extends AbstractValueObject
{
    protected string $duration = '';

    protected array $content = [];

    public function getDuration(): string
    {
        return $this->duration;
    }

    public function setDuration(string $duration): void
    {
        $this->duration = $duration;
    }

    public function getContent(): array
    {
        return $this->content;
    }

    public function setContent(array $content): void
    {
        $this->content = $content;
    }
}
