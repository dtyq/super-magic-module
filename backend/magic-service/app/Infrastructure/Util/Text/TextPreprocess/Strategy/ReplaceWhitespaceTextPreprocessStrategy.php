<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\Util\Text\TextPreprocess\Strategy;

class ReplaceWhitespaceTextPreprocessStrategy extends AbstractTextPreprocessStrategy
{
    public function preprocess(string $content): string
    {
        // 替换连续的换行符为单个换行符
        $content = preg_replace('/\n+/', "\n", $content);

        // 替换连续的制表符为单个制表符
        $content = preg_replace('/\t+/', "\t", $content);

        // 替换连续的空格为单个空格
        return preg_replace('/ +/', ' ', $content);
    }
}
