<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\Util\Text\TextPreprocess;

use App\Infrastructure\Util\Text\TextPreprocess\Strategy\RemoveUrlEmailTextPreprocessStrategy;
use App\Infrastructure\Util\Text\TextPreprocess\Strategy\ReplaceWhitespaceTextPreprocessStrategy;
use App\Infrastructure\Util\Text\TextPreprocess\Strategy\TextPreprocessStrategyInterface;
use App\Infrastructure\Util\Text\TextPreprocess\ValueObject\TextPreprocessRule;

/**
 * 文本预处理工具.
 */
class TextPreprocessUtil
{
    /**
     * 根据文本预处理规则进行预处理.
     * @param array<TextPreprocessRule> $rules
     */
    public static function preprocess(array $rules, string $text): string
    {
        foreach ($rules as $rule) {
            /** @var ?TextPreprocessStrategyInterface $strategy */
            $strategy = match ($rule) {
                TextPreprocessRule::REPLACE_WHITESPACE => di(ReplaceWhitespaceTextPreprocessStrategy::class),
                TextPreprocessRule::REMOVE_URL_EMAIL => di(RemoveUrlEmailTextPreprocessStrategy::class),
                default => null,
            };
            if (! $strategy instanceof TextPreprocessStrategyInterface) {
                continue;
            }
            $text = $strategy->preprocess($text);
        }
        return $text;
    }
}
