<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace HyperfTest\Cases\Application\Flow\BuiltIn\ToolSet\TeamshareBox\Tools;

use App\Application\Flow\ExecuteManager\NodeRunner\NodeRunnerFactory;
use App\Domain\Flow\Entity\ValueObject\Node;
use App\Domain\Flow\Entity\ValueObject\NodeInput;
use App\Domain\Flow\Entity\ValueObject\NodeOutput;
use App\Domain\Flow\Entity\ValueObject\NodeType;
use App\Infrastructure\Core\Dag\VertexResult;
use Connector\Component\ComponentFactory;
use Connector\Component\Structure\StructureType;
use HyperfTest\Cases\Application\Flow\ExecuteManager\ExecuteManagerBaseTest;

/**
 * @internal
 */
class TeamshareMarkdownQueryBuiltInToolTest extends ExecuteManagerBaseTest
{
    public function testRunByTool()
    {
        $node = Node::generateTemplate(NodeType::Tool, [
            'tool_id' => 'teamshare_box_teamshare_doc_markdown_query',
            'mode' => 'parameter',
            'async' => false,
            'custom_system_input' => null,
        ]);
        $output = new NodeOutput();
        $output->setForm(ComponentFactory::generateTemplate(StructureType::Form));
        $node->setOutput($output);

        $input = new NodeInput();
        $input->setForm(ComponentFactory::fastCreate(json_decode(
            <<<'JSON'
{
    "id": "component-6734b427d0ddc",
    "version": "1",
    "type": "form",
    "structure": {
        "type": "object",
        "key": "root",
        "sort": 0,
        "title": "root节点",
        "description": "",
        "items": null,
        "value": null,
        "required": [
            "file_id"
        ],
        "properties": {
            "file_id": {
                "type": "string",
                "key": "file_id",
                "title": "文件key",
                "description": "文件key",
                "required": null,
                "value": {
                    "type": "const",
                    "const_value": [
                        {
                            "type": "fields",
                            "value": "9527.file_id",
                            "name": "",
                            "args": null
                        }
                    ],
                    "expression_value": null
                },
                "encryption": false,
                "encryption_value": null,
                "items": null,
                "properties": null
            }
        }
    }
}
JSON
            ,
            true
        )));
        $node->setInput($input);

        $runner = NodeRunnerFactory::make($node);

        $vertexResult = new VertexResult();
        $executionData = $this->createExecutionData();
        $executionData->saveNodeContext('9527', [
            'file_id' => '723254899279966208',
        ]);
        $runner->execute($vertexResult, $executionData, []);

        $this->assertTrue($node->getNodeDebugResult()->isSuccess());
    }
}
