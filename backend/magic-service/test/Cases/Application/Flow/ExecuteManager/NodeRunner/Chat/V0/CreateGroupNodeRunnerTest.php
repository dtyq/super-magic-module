<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace HyperfTest\Cases\Application\Flow\ExecuteManager\NodeRunner\Chat\V0;

use App\Application\Flow\ExecuteManager\NodeRunner\NodeRunnerFactory;
use App\Domain\Flow\Entity\ValueObject\Node;
use App\Domain\Flow\Entity\ValueObject\NodeType;
use App\Infrastructure\Core\Dag\VertexResult;
use HyperfTest\Cases\Application\Flow\ExecuteManager\ExecuteManagerBaseTest;

/**
 * @internal
 */
class CreateGroupNodeRunnerTest extends ExecuteManagerBaseTest
{
    public function testRun()
    {
        $node = Node::generateTemplate(NodeType::CreateGroup, json_decode(
            <<<'JSON'
{
    "group_name": {
        "id": "component-675a8f8f40326",
        "version": "1",
        "type": "value",
        "structure": {
            "type": "expression",
            "const_value": null,
            "expression_value": [
                {
                    "type": "fields",
                    "value": "9527.group_name",
                    "name": "",
                    "args": null
                }
            ]
        }
    },
    "group_owner": {
        "id": "component-675a8f8f40367",
        "version": "1",
        "type": "value",
        "structure": {
            "type": "const",
            "const_value": [
                {
                    "type": "member",
                    "value": "message",
                    "name": "message",
                    "args": null,
                    "member_value": [
                        {
                            "id": "usi_516c3a162c868e6f02de247a10e59d05",
                            "name": "廖炳为"
                        }
                    ]
                }
            ],
            "expression_value": null
        }
    },
    "group_members": {
        "id": "component-675a8f8f4036d",
        "version": "1",
        "type": "value",
        "structure": {
            "type": "const",
            "const_value": [
                {
                    "type": "member",
                    "value": "message",
                    "name": "message",
                    "args": null,
                    "member_value": [
                        {
                            "id": "usi_eb3a4884d3dda84e9a8d8644e9365c2c",
                            "name": "蔡伦多"
                        },
                        {
                            "id": "usi_a450dd07688be6273b5ef112ad50ba7e",
                            "name": "李海清"
                        },
                        {
                            "id": "usi_516c3a162c868e6f02de247a10e59d05",
                            "name": "廖炳为"
                        }
                    ]
                }
            ],
            "expression_value": null
        }
    },
    "group_type": 5,
    "include_current_user": true,
    "include_current_assistant": true
}
JSON,
            true
        ));

        $runner = NodeRunnerFactory::make($node);
        $vertexResult = new VertexResult();
        $executionData = $this->createExecutionData();
        $executionData->saveNodeContext('9527', [
            'group_name' => '单测创建的测试群聊',
        ]);
        $executionData->getTriggerData()->setAgentKey('7f183858974fe7d1d69346afd5f8db3f211de4c6310b37fee50a2b16349665c6');
        $runner->execute($vertexResult, $executionData, []);

        $this->assertTrue($node->getNodeDebugResult()->isSuccess());
    }
}
