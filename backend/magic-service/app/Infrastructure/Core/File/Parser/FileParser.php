<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\Core\File\Parser;

use App\ErrorCode\FlowErrorCode;
use App\Infrastructure\Core\Exception\ExceptionBuilder;
use App\Infrastructure\Core\File\Parser\Driver\Interfaces\ExcelFileParserDriverInterface;
use App\Infrastructure\Core\File\Parser\Driver\Interfaces\FileParserDriverInterface;
use App\Infrastructure\Core\File\Parser\Driver\Interfaces\OcrFileParserDriverInterface;
use App\Infrastructure\Core\File\Parser\Driver\Interfaces\TextFileParserDriverInterface;
use App\Infrastructure\Core\File\Parser\Driver\Interfaces\WordFileParserDriverInterface;
use App\Infrastructure\Util\SSRF\Exception\SSRFException;
use App\Infrastructure\Util\SSRF\SSRFUtil;
use App\Infrastructure\Util\Text\TextPreprocess\TextPreprocessUtil;
use App\Infrastructure\Util\Text\TextPreprocess\ValueObject\TextPreprocessRule;
use Hyperf\Redis\Redis;
use Symfony\Component\Mime\MimeTypes;

class FileParser
{
    public function __construct(protected Redis $redis)
    {
    }

    /**
     * @throws SSRFException
     */
    public function parse(string $fileUrl, bool $textPreprocess = false): string
    {
        // 使用md5作为缓存key
        $cacheKey = 'file_parser:parse_' . md5($fileUrl) . '_' . ($textPreprocess ? 1 : 0);
        // 检查缓存,如果存在则返回缓存内容
        $cachedContent = $this->redis->get($cacheKey);
        if ($cachedContent !== false) {
            return $cachedContent;
        }
        try {
            // / 检测文件安全性
            $safeUrl = SSRFUtil::getSafeUrl($fileUrl, replaceIp: false);
            $tempFile = tempnam(sys_get_temp_dir(), 'downloaded_');

            $this->downloadFile($safeUrl, $tempFile, 50 * 1024 * 1024);

            // 检查文件的MIME类型
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mimeType = finfo_file($finfo, $tempFile);
            finfo_close($finfo);

            $extension = self::getExtensionFromMimeType($mimeType);
            if (! $extension) {
                ExceptionBuilder::throw(FlowErrorCode::Error, message: "无法从MIME类型 '{$mimeType}' 确定文件扩展名");
            }

            /** @var FileParserDriverInterface $interface */
            $interface = match ($extension) {
                // 更多的文件类型支持
                'pdf', 'png', 'jpeg', 'jpg' => di(OcrFileParserDriverInterface::class),
                'xlsx','xls' => di(ExcelFileParserDriverInterface::class),
                'txt', 'json', 'csv', 'md', 'mdx',
                'py', 'java', 'php', 'js', 'html', 'htm', 'css', 'xml', 'yaml', 'yml', 'sql' => di(TextFileParserDriverInterface::class),
                'docx', 'doc' => di(WordFileParserDriverInterface::class),
                default => ExceptionBuilder::throw(FlowErrorCode::ExecuteFailed, 'flow.node.loader.unsupported_file_type', ['file_extension' => $extension]),
            };
            $res = $interface->parse($tempFile, $fileUrl, $extension);
            // 如果是csv、xlsx、xls文件，需要进行额外处理
            if ($textPreprocess && in_array($extension, ['csv', 'xlsx', 'xls'])) {
                $res = TextPreprocessUtil::preprocess([TextPreprocessRule::EXCEL_HEADER_CONCAT], $res);
            }

            // 设置缓存
            $this->redis->set($cacheKey, $res, 600);
            return $res;
        } finally {
            if (isset($tempFile) && file_exists($tempFile)) {
                unlink($tempFile); // 确保临时文件被删除
            }
        }
    }

    /**
     * 下载文件到临时位置.
     */
    private static function downloadFile(string $url, string $tempFile, int $maxSize = 0): void
    {
        // 如果是本地文件路径，直接返回
        if (file_exists($url)) {
            return;
        }

        // 如果url是本地文件协议，转换为实际路径
        if (str_starts_with($url, 'file://')) {
            $localPath = substr($url, 7);
            if (file_exists($localPath)) {
                return;
            }
        }
        self::checkUrlFileSize($url, $maxSize);

        $context = stream_context_create([
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false,
            ],
        ]);
        $fileStream = fopen($url, 'r', false, $context);
        $localFile = fopen($tempFile, 'w');

        if (! $fileStream || ! $localFile) {
            ExceptionBuilder::throw(FlowErrorCode::Error, message: '无法打开文件流');
        }

        stream_copy_to_stream($fileStream, $localFile);

        fclose($fileStream);
        fclose($localFile);
    }

    /**
     * 检查文件大小是否超限.
     */
    private static function checkUrlFileSize(string $fileUrl, int $maxSize = 0): void
    {
        if ($maxSize <= 0) {
            return;
        }
        // 下载之前，检测文件大小
        $headers = get_headers($fileUrl, true);
        if (isset($headers['Content-Length'])) {
            $fileSize = (int) $headers['Content-Length'];
            if ($fileSize > $maxSize) {
                ExceptionBuilder::throw(FlowErrorCode::Error, message: '文件大小超过限制');
            }
        }
        // 不允许下载没有Content-Length的文件
        if (! isset($headers['Content-Length'])) {
            ExceptionBuilder::throw(FlowErrorCode::Error, message: '文件大小未知，禁止下载');
        }
    }

    /**
     * 从MIME类型获取文件扩展名.
     */
    private static function getExtensionFromMimeType(string $mimeType): ?string
    {
        $mimeTypes = new MimeTypes();
        $extensions = $mimeTypes->getExtensions($mimeType);
        return $extensions[0] ?? null; // 返回第一个匹配的扩展名
    }
}
