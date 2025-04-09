<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\Core\File\Parser\Driver;

use App\ErrorCode\FlowErrorCode;
use App\Infrastructure\Core\Exception\ExceptionBuilder;
use App\Infrastructure\Core\File\Parser\Driver\Interfaces\ExcelFileParserDriverDriverInterface;
use PhpOffice\PhpSpreadsheet\IOFactory as PhpSpreadsheetIOFactory;
use PhpOffice\PhpSpreadsheet\Reader\Exception as ReaderException;
use Vtiful\Kernel\Excel;

class ExcelFileParserDriverDriver implements ExcelFileParserDriverDriverInterface
{
    public function parse(string $filePath, string $fileExtension): string
    {
        if ($fileExtension === '.xls') {
            return $this->parseByXlsWriter($filePath, $fileExtension);
        }
        return $this->parseBySpreedSheet($filePath, $fileExtension);
    }

    private function parseByXlsWriter(string $filePath, string $fileExtension): string
    {
        $tempFile = tempnam(sys_get_temp_dir(), 'excel_') . '.' . $fileExtension;
        try {
            $inputStream = fopen($filePath, 'r');
            if (! $inputStream) {
                ExceptionBuilder::throw(FlowErrorCode::ExecuteFailed, sprintf('Download remote file failed: %s', $filePath));
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

    private function parseBySpreedSheet(string $filePath, string $fileExtension): string
    {
        $tempFile = tempnam(sys_get_temp_dir(), 'excel_') . '.' . $fileExtension;
        try {
            $inputStream = fopen($filePath, 'r');
            if (! $inputStream) {
                ExceptionBuilder::throw(FlowErrorCode::ExecuteFailed, sprintf('Download remote file failed: %s', $filePath));
            }
            $outputStream = fopen($tempFile, 'w');
            // 读取输入流并写入到输出流
            while ($data = fread($inputStream, 1024)) {
                fwrite($outputStream, $data);
            }
            @fclose($inputStream);
            @fclose($outputStream);

            try {
                $reader = PhpSpreadsheetIOFactory::createReaderForFile($tempFile);
                $spreadsheet = $reader->load($tempFile);
                $content = '';

                foreach ($spreadsheet->getSheetNames() as $sheetName) {
                    $content .= '##' . $sheetName . "\n";
                    $worksheet = $spreadsheet->getSheetByName($sheetName);
                    $highestRow = $worksheet->getHighestRow();
                    $highestColumn = $worksheet->getHighestColumn();

                    for ($row = 1; $row <= $highestRow; ++$row) {
                        $rowData = [];
                        for ($col = 'A'; $col <= $highestColumn; ++$col) {
                            $cellValue = $worksheet->getCell($col . $row)->getValue();
                            $rowData[] = strval($cellValue ?? '');
                        }
                        $content .= implode(',', $rowData) . "\n";
                    }
                    $content .= "\n";
                }

                return $content;
            } catch (ReaderException $e) {
                ExceptionBuilder::throw(FlowErrorCode::ExecuteFailed, sprintf('Failed to read Excel file: %s', $e->getMessage()));
            }
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
}
