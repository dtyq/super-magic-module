<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\Util\Odin\TextSplitter;

use Exception;
use Hyperf\Context\Context;
use Hyperf\Odin\TextSplitter\TextSplitter;
use Yethee\Tiktoken\Encoder;
use Yethee\Tiktoken\EncoderProvider;

class TokenTextSplitter extends TextSplitter
{
    /**
     * 设置最大缓存文本长度（字符数）
     * 超过此长度的文本将不会被缓存在协程上下文中.
     */
    private const int MAX_CACHE_TEXT_LENGTH = 1000;

    protected $chunkSize;

    protected $chunkOverlap;

    protected $keepSeparator;

    private string $fixedSeparator;

    private array $separators;

    /**
     * @var callable token计算闭包
     */
    private $tokenizer;

    /**
     * 默认token计算闭包使用到的encoderProvider.
     */
    private EncoderProvider $defaultEncoderProvider;

    /**
     * 默认token计算闭包使用到的encoder.
     */
    private Encoder $defaultEncoder;

    /**
     * @param null|callable $tokenizer token计算函数
     * @param null|array $separators 备选分隔符列表
     * @throws Exception
     */
    public function __construct(
        ?callable $tokenizer = null,
        int $chunkSize = 1000,
        int $chunkOverlap = 200,
        string $fixedSeparator = "\n\n",
        ?array $separators = null,
        bool $keepSeparator = false
    ) {
        $this->chunkSize = $chunkSize;
        $this->chunkOverlap = $chunkOverlap;
        $this->fixedSeparator = $fixedSeparator;
        $this->separators = $separators ?? ["\n\n", "\n", '。', ' ', ''];
        $this->tokenizer = $tokenizer ?? $this->getDefaultTokenizer();
        $this->keepSeparator = $keepSeparator;
        parent::__construct($chunkSize, $chunkOverlap, $keepSeparator);
    }

    /**
     * 分割文本.
     *
     * @param string $text 要分割的文本
     * @return array 分割后的文本块数组
     */
    public function splitText(string $text): array
    {
        // 检测并转换编码
        $encoding = $this->detectEncoding($text);
        if ($encoding !== 'UTF-8') {
            $text = mb_convert_encoding($text, 'UTF-8', $encoding);
        }

        // 使用固定分隔符进行初始分割
        $chunks = $this->fixedSeparator ? explode($this->fixedSeparator, $text) : [$text];

        // 计算每个chunk的token长度
        $chunksLengths = array_map(function ($chunk) {
            return ($this->tokenizer)($chunk);
        }, $chunks);

        $finalChunks = [];
        foreach ($chunks as $i => $chunk) {
            if ($chunksLengths[$i] > $this->chunkSize) {
                // 如果chunk太大，进行递归分割
                $finalChunks = array_merge($finalChunks, $this->recursiveSplitText($chunk));
            } else {
                $finalChunks[] = $chunk;
            }
        }

        return $finalChunks;
    }

    /**
     * 合并文本块.
     *
     * @param array $splits 要合并的文本块
     * @param string $separator 分隔符
     * @return array 合并后的文本块数组
     */
    protected function mergeSplits(array $splits, string $separator): array
    {
        $merged = [];
        $currentChunk = '';
        $currentLength = 0;

        foreach ($splits as $split) {
            $length = ($this->tokenizer)($split);

            if ($currentLength + $length > $this->chunkSize) {
                if ($currentChunk !== '') {
                    $merged[] = $currentChunk;
                }
                $currentChunk = $split;
                $currentLength = $length;
            } else {
                if ($currentChunk !== '') {
                    $currentChunk .= $separator;
                }
                $currentChunk .= $split;
                $currentLength += $length;
            }
        }

        if ($currentChunk !== '') {
            $merged[] = $currentChunk;
        }

        return $merged;
    }

    /**
     * 递归分割文本.
     *
     * @param string $text 要分割的文本
     * @return array 分割后的文本块数组
     */
    private function recursiveSplitText(string $text): array
    {
        $finalChunks = [];
        $separator = end($this->separators);
        $newSeparators = [];

        // 查找合适的分隔符
        foreach ($this->separators as $i => $sep) {
            if ($sep === '') {
                $separator = $sep;
                break;
            }
            if (str_contains($text, $sep)) {
                $separator = $sep;
                $newSeparators = array_slice($this->separators, $i + 1);
                break;
            }
        }

        // 使用选定的分隔符分割文本
        if ($separator !== '') {
            $splits = $separator === ' ' ? preg_split('/\s+/', $text) : explode($separator, $text);
        } else {
            $splits = mb_str_split($text);
        }

        // 过滤空字符串
        $splits = array_values(array_filter($splits, function ($s) {
            return $s !== '' && $s !== "\n";
        }));

        // 计算每个split的token长度
        $splitLengths = array_map(function ($split) {
            return ($this->tokenizer)($split);
        }, $splits);

        if ($separator !== '') {
            // 处理有分隔符的情况
            $goodSplits = [];
            $goodSplitsLengths = [];
            $actualSeparator = $this->keepSeparator ? $separator : '';

            foreach ($splits as $i => $split) {
                $splitLength = $splitLengths[$i];

                if ($splitLength < $this->chunkSize) {
                    $goodSplits[] = $split;
                    $goodSplitsLengths[] = $splitLength;
                } else {
                    if (! empty($goodSplits)) {
                        $mergedText = $this->mergeSplits($goodSplits, $actualSeparator);
                        $finalChunks = array_merge($finalChunks, $mergedText);
                        $goodSplits = [];
                        $goodSplitsLengths = [];
                    }

                    if (empty($newSeparators)) {
                        $finalChunks[] = $split;
                    } else {
                        $finalChunks = array_merge(
                            $finalChunks,
                            $this->recursiveSplitText($split)
                        );
                    }
                }
            }

            if (! empty($goodSplits)) {
                $mergedText = $this->mergeSplits($goodSplits, $actualSeparator);
                $finalChunks = array_merge($finalChunks, $mergedText);
            }
        } else {
            // 处理无分隔符的情况
            $currentPart = '';
            $currentLength = 0;
            $overlapPart = '';
            $overlapLength = 0;

            foreach ($splits as $i => $split) {
                $splitLength = $splitLengths[$i];

                if ($currentLength + $splitLength <= $this->chunkSize - $this->chunkOverlap) {
                    $currentPart .= $split;
                    $currentLength += $splitLength;
                } elseif ($currentLength + $splitLength <= $this->chunkSize) {
                    $currentPart .= $split;
                    $currentLength += $splitLength;
                    $overlapPart .= $split;
                    $overlapLength += $splitLength;
                } else {
                    $finalChunks[] = $currentPart;
                    $currentPart = $overlapPart . $split;
                    $currentLength = $splitLength + $overlapLength;
                    $overlapPart = '';
                    $overlapLength = 0;
                }
            }

            if ($currentPart !== '') {
                $finalChunks[] = $currentPart;
            }
        }

        return $finalChunks;
    }

    /**
     * 计算文本的token数量.
     */
    private function calculateTokenCount(string $text): int
    {
        if (! isset($this->defaultEncoderProvider)) {
            $this->defaultEncoderProvider = new EncoderProvider();
            $this->defaultEncoder = $this->defaultEncoderProvider->getForModel('gpt-4');
        }
        return count($this->defaultEncoder->encode($text));
    }

    private function getDefaultTokenizer(): callable
    {
        return function (string $text) {
            // 如果文本长度超过限制，直接计算不缓存
            if (mb_strlen($text) > self::MAX_CACHE_TEXT_LENGTH) {
                return $this->calculateTokenCount($text);
            }

            // 生成上下文键
            $contextKey = 'token_count:' . md5($text);

            // 尝试从协程上下文获取
            $count = Context::get($contextKey);
            if ($count !== null) {
                return $count;
            }

            // 计算 token 数量
            $count = $this->calculateTokenCount($text);

            // 存储到协程上下文
            Context::set($contextKey, $count);

            return $count;
        };
    }

    /**
     * 检测文件内容的编码
     */
    private function detectEncoding(string $content): string
    {
        // 检查 BOM
        if (str_starts_with($content, "\xEF\xBB\xBF")) {
            return 'UTF-8';
        }
        if (str_starts_with($content, "\xFF\xFE")) {
            return 'UTF-16LE';
        }
        if (str_starts_with($content, "\xFE\xFF")) {
            return 'UTF-16BE';
        }

        // 尝试检测编码
        $encoding = mb_detect_encoding($content, ['UTF-8', 'GBK', 'GB2312', 'BIG5', 'ASCII'], true);
        if ($encoding === false) {
            // 如果无法检测到编码，尝试使用 iconv 检测
            $encoding = mb_detect_encoding($content, ['UTF-8', 'GBK', 'GB2312', 'BIG5', 'ASCII'], false);
            if ($encoding === false) {
                return 'UTF-8'; // 默认使用 UTF-8
            }
        }

        return $encoding;
    }
}
