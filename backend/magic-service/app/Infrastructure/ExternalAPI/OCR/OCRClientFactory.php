<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\ExternalAPI\OCR;

use InvalidArgumentException;

class OCRClientFactory
{
    public function getClient(OCRClientType $type): OCRClientInterface
    {
        return match ($type) {
            OCRClientType::VOLCE => di()->get(VolceOCRClient::class),
            default => throw new InvalidArgumentException("Unsupported OCR client type: {$type->name}"),
        };
    }
}
