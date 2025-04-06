<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\Util\File;

use InvalidArgumentException;

class EasyFileTools
{
    public static function saveFile(string $path, string $stream): void
    {
        $file = fopen($path, 'wb');
        // 把stream切割成1000kb的小块，每次写入文件

        fwrite($file, $stream);
        fclose($file);
    }

    public static function mergeWavFiles(string $file1, string $blob): void
    {
        // 如果文件不存在，直接将 blob 写入为新的文件
        if (! file_exists($file1)) {
            self::saveFile($file1, $blob);
            return;
        }

        // 打开 file1 文件以读写模式
        $wav1 = fopen($file1, 'r+b');
        if (! $wav1) {
            throw new InvalidArgumentException('Failed to open the base file.');
        }
        // 去掉blob的头
        $blob = substr($blob, 44);

        // 将新数据追加到文件末尾
        // 获取文件大小
        fseek($wav1, 0, SEEK_END);
        fwrite($wav1, $blob);
        $fileSize = ftell($wav1);

        // 修正 RIFF 块大小（文件总大小 - 8）
        fseek($wav1, 4);
        fwrite($wav1, pack('V', $fileSize - 8));

        // 修正 data 块大小（文件总大小 - 44）
        fseek($wav1, 40);
        fwrite($wav1, pack('V', $fileSize - 44));

        // 关闭文件
        fclose($wav1);
    }

    //    public static function getAudioFormat(string $filePath)
    //    {
    //        $riff = RIFF::fromFilePath($filePath);
    //
    //        foreach ($riff->subChunks as $chunk) {
    //            if ($chunk instanceof FMTChunk) {
    //                return $chunk;
    //            }
    //        }
    //
    //        throw new InvalidArgumentException('Missing FMT chunk in the file');
    //    }
}
