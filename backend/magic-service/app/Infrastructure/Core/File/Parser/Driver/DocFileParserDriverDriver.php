<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\Core\File\Parser\Driver;

use App\ErrorCode\FlowErrorCode;
use App\Infrastructure\Core\Exception\ExceptionBuilder;
use App\Infrastructure\Core\File\Parser\Driver\Interfaces\DocFileParserDriverDriverInterface;
use PhpOffice\PhpWord\Element\TextRun;
use PhpOffice\PhpWord\IOFactory;

class DocFileParserDriverDriver implements DocFileParserDriverDriverInterface
{
    public function parse(string $filePath, string $fileExtension): string
    {
        $tempFile = tempnam(sys_get_temp_dir(), 'word_') . '.' . $fileExtension;
        try {
            $inputStream = fopen($filePath, 'r');
            if (! $inputStream) {
                ExceptionBuilder::throw(FlowErrorCode::ExecuteFailed, sprintf('Open remote file failed: %s', $filePath));
            }
            $outputStream = fopen($tempFile, 'w');
            // 读取输入流并写入到输出流
            while ($data = fread($inputStream, 1024)) {
                fwrite($outputStream, $data);
            }
            @fclose($inputStream);
            @fclose($outputStream);

            // 如果是.doc文件，先转换为.docx
            if ($fileExtension === 'doc') {
                // todo 这里有问题 会读取失败
                /**
                 * phpword 不支持旧格式的.doc
                 * Throw an exception since making further calls on the ZipArchive would cause a fatal error.
                 * This prevents fatal errors on corrupt archives and attempts to open old "doc" files.
                 */
                $reader = IOFactory::load($tempFile, 'MsDoc');
            } elseif ($fileExtension === 'docx') {
                $reader = IOFactory::load($tempFile, 'Word2007');
            } else {
                ExceptionBuilder::throw(FlowErrorCode::ExecuteFailed, 'flow.node.loader.unsupported_file_type', ['file_extension' => $fileExtension]);
            }

            $content = '';
            foreach ($reader->getSections() as $section) {
                foreach ($section->getElements() as $element) {
                    if (method_exists($element, 'getText')) {
                        $text = $element->getText();
                        if (is_string($text)) {
                            $content .= $text;
                        }
                        if (is_array($text)) {
                            foreach ($text as $value) {
                                if (is_string($value)) {
                                    $content .= $value;
                                }
                            }
                        }
                        if ($text instanceof TextRun) {
                            $content .= $text->getText();
                        }
                        $content .= "\r\n";
                    }
                }
            }
            return $content;
        } finally {
            if (isset($inputStream) && is_resource($inputStream)) {
                @fclose($inputStream);
            }
            if (isset($outputStream) && is_resource($outputStream)) {
                @fclose($outputStream);
            }
            @unlink($tempFile);
        }

        // // 如果是.doc文件，先转换为.docx
        //        if ($fileExtension === 'doc') {
        //            $reader = IOFactory::createReader();
        //            $phpWord = $reader->load($filePath);
        //
        //            // 将转换后的.docx保存到临时文件
        //            $tempDocxPath = tempnam(sys_get_temp_dir(), 'PhpWord');
        //            $writer = IOFactory::createWriter($phpWord, 'Word2007');
        //            $writer->save($tempDocxPath);
        //
        //            // 重新将临时文件路径设置为新的.docx文件路径
        //            $filePath = $tempDocxPath;
        //        }
    }
}
