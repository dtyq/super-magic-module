<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\Util\Asr\ValueObject;

use App\Infrastructure\Core\AbstractValueObject;

class AsrResult extends AbstractValueObject
{
    protected string $text;

    public function __construct(string $text)
    {
        $this->text = $text;
    }

    public function getText(): string
    {
        return $this->text;
    }

    public function setText(): string
    {
        return $this->text;
    }
}
