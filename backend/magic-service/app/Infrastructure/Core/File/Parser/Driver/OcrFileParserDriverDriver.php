<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\Core\File\Parser\Driver;

use App\Infrastructure\Core\File\Parser\Driver\Interfaces\OcrFileParserDriverDriverInterface;
use App\Infrastructure\ExternalAPI\OCR\OCRClientType;
use App\Infrastructure\ExternalAPI\OCR\OCRService;

class OcrFileParserDriverDriver implements OcrFileParserDriverDriverInterface
{
    public function parse(string $filePath, string $fileExtension): string
    {
        /** @var OCRService $ocrService */
        $ocrService = di()->get(OCRService::class);
        return $ocrService->ocr(OCRClientType::VOLCE, $filePath);
    }
}
