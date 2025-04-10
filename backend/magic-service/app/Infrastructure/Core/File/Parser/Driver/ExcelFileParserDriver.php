<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\Core\File\Parser\Driver;

use App\ErrorCode\FlowErrorCode;
use App\Infrastructure\Core\Exception\ExceptionBuilder;
use App\Infrastructure\Core\File\Parser\Driver\Interfaces\ExcelFileParserDriverInterface;
use Exception;
use PhpOffice\PhpSpreadsheet\IOFactory as PhpSpreadsheetIOFactory;
use PhpOffice\PhpSpreadsheet\Reader\Exception as ReaderException;
use Vtiful\Kernel\Excel;

class ExcelFileParserDriver implements ExcelFileParserDriverInterface
{
    public function parse(string $filePath, string $url, string $fileExtension): string
    {
        if ($fileExtension === '.xls') {
            return $this->parseByXlsWriter($filePath, $fileExtension);
        }
        return $this->parseBySpreedSheet($filePath, $fileExtension);
    }

    private function parseByXlsWriter(string $filePath, string $fileExtension): string
    {
        try {
            $excel = new Excel([
                'path' => dirname($filePath),
            ]);
            $excelFile = $excel->openFile(basename($filePath));
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
        } catch (Exception $e) {
            ExceptionBuilder::throw(FlowErrorCode::ExecuteFailed, sprintf('Failed to read Excel file: %s', $e->getMessage()));
        }
        return $content;
    }

    private function parseBySpreedSheet(string $filePath, string $fileExtension): string
    {
        try {
            $reader = PhpSpreadsheetIOFactory::createReaderForFile($filePath);
            $spreadsheet = $reader->load($filePath);
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
        } catch (ReaderException $e) {
            ExceptionBuilder::throw(FlowErrorCode::ExecuteFailed, sprintf('Failed to read Excel file: %s', $e->getMessage()));
        }
        return $content;
    }
}
