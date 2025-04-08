<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\Core\File;

use App\ErrorCode\FlowErrorCode;
use App\Infrastructure\Core\Exception\ExceptionBuilder;
use App\Infrastructure\ExternalAPI\OCR\OCRClientType;
use App\Infrastructure\ExternalAPI\OCR\OCRService;
use App\Infrastructure\Util\FileType;
use App\Infrastructure\Util\SSRF\Exception\SSRFException;
use App\Infrastructure\Util\SSRF\SSRFUtil;
use PhpOffice\PhpWord\Element\TextRun;
use PhpOffice\PhpWord\IOFactory;
use Vtiful\Kernel\Excel;

use function di;

class FileParser
{
    /**
     * @throws SSRFException
     */
    public function parse(string $fileUrl)
    {
        // 安全 url 检查
        $link = SSRFUtil::getSafeUrl($fileUrl, replaceIp: false);

        // 根据链接获取文件类型，这里只获取后缀可能不准确
        $fileExtension = FileType::getType($link);

        return match ($fileExtension) {
            // 更多的文件类型支持
            'pdf', 'png', 'jpeg', 'jpg' => $this->ocr($link),
            'xlsx', 'xls' => $this->excel($link, $fileExtension),
            'txt', 'json', 'csv', 'md', 'mdx',
            'py', 'java', 'php', 'js', 'html', 'htm', 'css', 'xml', 'yaml', 'yml', 'sql', => $this->get($link),
            'doc', 'docx', => $this->doc($link, $fileExtension),
            default => ExceptionBuilder::throw(FlowErrorCode::ExecuteFailed, 'flow.node.loader.unsupported_file_type', ['file_extension' => $fileExtension]),
        };
    }

    private function ocr(string $link): string
    {
        /** @var OCRService $ocrService */
        $ocrService = di()->get(OCRService::class);
        return $ocrService->ocr(OCRClientType::VOLCE, $link);
    }

    private function excel(string $url, string $fileExtension): string
    {
        $tempFile = tempnam(sys_get_temp_dir(), 'excel_') . '.' . $fileExtension;
        try {
            $inputStream = fopen($url, 'r');
            if (! $inputStream) {
                ExceptionBuilder::throw(FlowErrorCode::ExecuteFailed, sprintf('Download remote file failed: %s', $url));
            }
            $outputStream = fopen($tempFile, 'w');
            // 读取输入流并写入到输出流
            while ($data = fread($inputStream, 1024)) {
                fwrite($outputStream, $data);
            }
            @fclose($inputStream);
            @fclose($outputStream);

            $excel = new Excel([
                'path' => sys_get_temp_dir(),
            ]);
            $excelFile = $excel->openFile(basename($tempFile));
            $sheetList = $excelFile->sheetList();
            $content = '';
            foreach ($sheetList as $sheetName) {
                $content .= '##' . $sheetName . "\n";
                $sheet = $excelFile->openSheet($sheetName, Excel::SKIP_EMPTY_ROW);
                while (($row = $sheet->nextRow()) !== null) {
                    // 暂时使用 csv 格式
                    $csvRow = implode(',', array_map(fn ($cell) => strval($cell), $row));
                    $content .= $csvRow . "\n";
                }
                /* @phpstan-ignore-next-line */
                $content .= "\n";
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
    }

    private function doc(string $url, string $fileExtension): string
    {
        $tempFile = tempnam(sys_get_temp_dir(), 'word_') . '.' . $fileExtension;
        try {
            $inputStream = fopen($url, 'r');
            if (! $inputStream) {
                ExceptionBuilder::throw(FlowErrorCode::ExecuteFailed, sprintf('Open remote file failed: %s', $url));
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

    private function get(string $link): string
    {
        try {
            $inputStream = fopen($link, 'r');
            if (! $inputStream) {
                ExceptionBuilder::throw(FlowErrorCode::ExecuteFailed, sprintf('Open remote file failed: %s', $link));
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
