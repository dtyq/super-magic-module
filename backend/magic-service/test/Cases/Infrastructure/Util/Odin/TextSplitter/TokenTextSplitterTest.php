<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace HyperfTest\Cases\Infrastructure\Util\Odin\TextSplitter;

use App\Infrastructure\Util\Odin\TextSplitter\TokenTextSplitter;
use HyperfTest\Cases\BaseTest;

/**
 * @internal
 */
class TokenTextSplitterTest extends BaseTest
{
    private TokenTextSplitter $splitter;

    protected function setUp(): void
    {
        parent::setUp();
        $this->splitter = new TokenTextSplitter();
    }

    public function testBasicTextSplitting()
    {
        $text = "这是第一段。\n\n这是第二段。\n\n这是第三段。";
        $chunks = $this->splitter->splitText($text);

        $this->assertIsArray($chunks);
        $this->assertNotEmpty($chunks);
        $this->assertCount(3, $chunks);
    }

    public function testCustomSeparator()
    {
        $splitter = new TokenTextSplitter(
            null,
            1000,
            200,
            '。',
            ['。', '，', ' ']
        );

        $text = '这是第一段。这是第二段。这是第三段。';
        $chunks = $splitter->splitText($text);

        $this->assertIsArray($chunks);
        $this->assertNotEmpty($chunks);
    }

    public function testPreserveSeparator()
    {
        $splitter = new TokenTextSplitter(
            null,
            1000,
            200,
            '。',
            ['。', '，', ' '],
            false,
            true
        );

        $text = '这是第一段。这是第二段。这是第三段。';
        $chunks = $splitter->splitText($text);

        $this->assertIsArray($chunks);
        $this->assertNotEmpty($chunks);
        $this->assertStringStartsWith('这是第一段', $chunks[0]);
        $this->assertStringStartsWith('。这是第二段', $chunks[1]);
    }

    public function testEncodingHandling()
    {
        $text = mb_convert_encoding("这是测试文本。\n\n这是第二段。", 'GBK', 'UTF-8');
        $chunks = $this->splitter->splitText($text);

        $this->assertIsArray($chunks);
        $this->assertNotEmpty($chunks);
        $this->assertEquals('UTF-8', mb_detect_encoding($chunks[0], 'UTF-8', true));
    }

    public function testLongTextSplitting()
    {
        $text = str_repeat('这是一个测试句子。', 100);
        $chunks = $this->splitter->splitText($text);

        $this->assertIsArray($chunks);
        $this->assertNotEmpty($chunks);
        foreach ($chunks as $chunk) {
            $this->assertLessThanOrEqual(1000, strlen($chunk));
        }
    }

    public function testCustomTokenizer()
    {
        $customTokenizer = function (string $text) {
            return strlen($text);
        };

        $splitter = new TokenTextSplitter($customTokenizer);
        $text = "这是第一段。\n\n这是第二段。";
        $chunks = $splitter->splitText($text);

        $this->assertIsArray($chunks);
        $this->assertNotEmpty($chunks);
    }

    public function testMarkdownSplitting1()
    {
        $splitter = new TokenTextSplitter(
            null,
            1000,
            200,
            "\n\n##",
            ["\n\n##", "\n##", "\n\n", "\n", '。', ' ', ''],
            preserveSeparator: true
        );

        $text = <<<'EOT'
# 主标题

这是第一段内容。

## 二级标题1

这是二级标题1下的内容。
这里有一些细节说明。

## 二级标题2

这是二级标题2下的内容。
这里有一些其他说明。

## 二级标题3

这是最后一段内容。
EOT;

        $chunks = $splitter->splitText($text);

        $this->assertIsArray($chunks);
        $this->assertNotEmpty($chunks);
        $this->assertCount(4, $chunks);

        // 验证第一个块包含主标题和第一段内容
        $this->assertStringContainsString('# 主标题', $chunks[0]);
        $this->assertStringContainsString('这是第一段内容', $chunks[0]);

        // 验证第二个块包含二级标题1及其内容
        $this->assertStringContainsString('## 二级标题1', $chunks[1]);
        $this->assertStringContainsString('这是二级标题1下的内容', $chunks[1]);

        // 验证第三个块包含二级标题2及其内容
        $this->assertStringContainsString('## 二级标题2', $chunks[2]);
        $this->assertStringContainsString('这是二级标题2下的内容', $chunks[2]);

        // 验证第四个块包含二级标题3及其内容
        $this->assertStringContainsString('## 二级标题3', $chunks[3]);
        $this->assertStringContainsString('这是最后一段内容', $chunks[3]);
    }

    public function testMarkdownSplitting2()
    {
        $splitter = new TokenTextSplitter(
            null,
            1000,
            200,
            "\n\n**",
            preserveSeparator: true
        );

        $text = <<<'EOT'
** 主标题 **

这是第一段内容。

** 二级标题1 **

这是二级标题1下的内容。
这里有一些细节说明。

** 二级标题2 **

这是二级标题2下的内容。
这里有一些其他说明。

** 二级标题3 **

这是最后一段内容。
EOT;

        $chunks = $splitter->splitText($text);

        $this->assertIsArray($chunks);
        $this->assertNotEmpty($chunks);
        $this->assertCount(4, $chunks);

        // 验证第一个块包含主标题和第一段内容
        $this->assertStringContainsString('** 主标题 **', $chunks[0]);
        $this->assertStringContainsString('这是第一段内容', $chunks[0]);

        // 验证第二个块包含二级标题1及其内容
        $this->assertStringContainsString('** 二级标题1 **', $chunks[1]);
        $this->assertStringContainsString('这是二级标题1下的内容', $chunks[1]);

        // 验证第三个块包含二级标题2及其内容
        $this->assertStringContainsString('** 二级标题2 **', $chunks[2]);
        $this->assertStringContainsString('这是二级标题2下的内容', $chunks[2]);

        // 验证第四个块包含二级标题3及其内容
        $this->assertStringContainsString('** 二级标题3 **', $chunks[3]);
        $this->assertStringContainsString('这是最后一段内容', $chunks[3]);
    }
}
