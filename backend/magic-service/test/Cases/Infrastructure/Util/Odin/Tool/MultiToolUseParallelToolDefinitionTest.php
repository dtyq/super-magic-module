<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace HyperfTest\Cases\Infrastructure\Util\Odin\Tool;

use Hyperf\Odin\Agent\Tool\MultiToolUseParallelTool;
use Hyperf\Odin\Api\Response\ToolCall;
use Hyperf\Odin\Tool\Definition\ToolDefinition;
use HyperfTest\Cases\BaseTest;

/**
 * @internal
 */
class MultiToolUseParallelToolDefinitionTest extends BaseTest
{
    public function testRun()
    {
        $toolCalls = json_decode(<<<'JSON'
[
    {
        "id": "call_ChwTCG2ZU0LjNWk9D0oxf0Qe",
        "function": {
            "name": "multi_tool_use.parallel",
            "arguments": "{\"tool_uses\":[{\"recipient_name\":\"functions.teamshare_knowledge_search\",\"parameters\":{\"keyword\":\"餐补\",\"names\":[\"KK 集团-人事&行政说明书\",\"人事知识库\"]}},{\"recipient_name\":\"functions.teamshare_knowledge_search\",\"parameters\":{\"keyword\":\"餐补\",\"names\":[\"KK 集团-人事&行政说明书\",\"人事知识库\"]}}]}"
        },
        "type": "function"
    }
]
JSON, true);
        $toolCall = ToolCall::fromArray($toolCalls)[0];

        $tool = new MultiToolUseParallelTool([
            'teamshare_knowledge_search' => new class extends ToolDefinition {
                public function __construct()
                {
                    parent::__construct(
                        name: 'teamshare_knowledge_search',
                        toolHandler: [$this, 'teamshare_knowledge_search']
                    );
                }

                public function teamshare_knowledge_search($args): array
                {
                    return [
                        'keyword' => $args['keyword'],
                        'names' => $args['names'],
                    ];
                }
            },
        ]);
        $callToolResult = call_user_func($tool->getToolHandler(), $toolCall->getArguments());
        $this->assertCount(2, $callToolResult);
    }
}
