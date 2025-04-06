<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\ExternalAPI\ImageGenerateAPI\Request;

class FluxModelRequest extends ImageGenerateRequest
{
    protected ?string $mode = 'flux1-pro';

    public function getMode(): ?string
    {
        return $this->mode;
    }

    public function setMode(string $mode): void
    {
        $this->mode = $mode;
    }
}
