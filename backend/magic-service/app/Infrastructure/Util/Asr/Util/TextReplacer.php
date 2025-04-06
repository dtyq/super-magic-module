<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\Util\Asr\Util;

use FuzzyWuzzy\Fuzz;
use Hyperf\Logger\LoggerFactory;
use Psr\Log\LoggerInterface;

class TextReplacer
{
    protected LoggerInterface $logger;

    protected array $replacements;

    protected int $threshold;

    protected array $cache = [];

    public function __construct(
        LoggerFactory $loggerFactory,
        protected Fuzz $fuzz,
    ) {
        $this->logger = $loggerFactory->get('asr');
        $this->threshold = config('asr.text_replacer.fuzz.threshold') ?? 80;
        $this->replacements = config('asr.text_replacer.fuzz.replacement') ?? [];
    }

    public function replaceWordsByFuzz(string $text): string
    {
        $words = preg_split('/(\s+|(?<=[\p{Han}])(?=[\p{P}\s])|(?<=[\p{P}\s])(?=[\p{Han}]))/u', $text, -1, PREG_SPLIT_NO_EMPTY);
        $result = [];
        $replacementOccurred = false;

        foreach ($words as $word) {
            // 检查缓存
            if (isset($this->cache[$word])) {
                $result[] = $this->cache[$word];
                if ($this->cache[$word] !== $word) {
                    $replacementOccurred = true;
                }
                continue;
            }

            $bestMatch = null;
            $bestScore = 0;
            $bestKey = null;

            foreach ($this->replacements as $key => $value) {
                $score = $this->fuzz->partialRatio(strtolower($word), strtolower($key));
                if ($score > $bestScore && $score >= $this->threshold) {
                    $bestMatch = $value;
                    $bestScore = $score;
                    $bestKey = $key;
                }
            }

            if ($bestMatch !== null) {
                $replacementOccurred = true;
                $this->logger->info('替换词', [
                    'original' => $word,
                    'replacement' => $bestMatch,
                    'score' => $bestScore,
                ]);

                // 替换匹配的部分，保留其余部分
                $pattern = '/' . preg_quote($bestKey, '/') . '/ui';
                $replaced = preg_replace($pattern, $bestMatch, $word);
                $result[] = $replaced;

                // 添加到缓存
                $this->cache[$word] = $replaced;
            } else {
                $result[] = $word;
                // 将未替换的词也添加到缓存
                $this->cache[$word] = $word;
            }
        }

        $finalText = implode('', $result);

        if ($replacementOccurred) {
            $this->logger->info('替换前文本', ['text' => $text]);
            $this->logger->info('替换后文本', ['text' => $finalText]);
        }

        return $finalText;
    }

    public function addReplacement(string $key, string $value): void
    {
        $this->replacements[$key] = $value;
        $this->logger->info('添加新的替换规则', ['key' => $key, 'value' => $value]);
        $this->clearCache(); // 添加新规则后清除缓存
    }

    public function clearCache(): void
    {
        $this->cache = [];
        $this->logger->info('清除替换缓存');
    }
}
