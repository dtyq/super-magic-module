<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\Core\File\Parser\Driver;

use App\ErrorCode\FlowErrorCode;
use App\Infrastructure\Core\Exception\ExceptionBuilder;
use App\Infrastructure\Core\File\Parser\Driver\Interfaces\TextFileParserDriverDriverInterface;

class TextFileParserDriverDriver implements TextFileParserDriverDriverInterface
{
    public function parse(string $filePath, string $fileExtension): string
    {
        try {
            $inputStream = fopen($filePath, 'r');
            if (! $inputStream) {
                ExceptionBuilder::throw(FlowErrorCode::ExecuteFailed, sprintf('Open remote file failed: %s', $filePath));
            }
            $content = '';
            // 读取输入流并写入到输出流
            while ($data = fread($inputStream, 1024)) {
                $content .= $data;
            }
            @fclose($inputStream);

            return $content;
        } finally {
            if (isset($inputStream) && is_resource($inputStream)) {
                @fclose($inputStream);
            }
        }
    }
}
