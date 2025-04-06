<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace HyperfTest\Cases\Application\Flow\ExecuteManager\NodeRunner\TeamshareMultiTable;

use App\Application\Flow\ExecuteManager\ExecutionData\ExecutionData;
use App\Application\Flow\ExecuteManager\NodeRunner\NodeRunnerFactory;
use App\Domain\Flow\Entity\ValueObject\Node;
use App\Domain\Flow\Entity\ValueObject\NodeOutput;
use App\Domain\Flow\Entity\ValueObject\NodeType;
use App\Infrastructure\Core\Dag\VertexResult;
use Connector\Component\ComponentFactory;
use Connector\Component\Structure\StructureType;
use HyperfTest\Cases\Application\Flow\ExecuteManager\ExecuteManagerBaseTest;

/**
 * @internal
 */
class TeamshareMultiTableCreateRecordNodeRunnerTest extends ExecuteManagerBaseTest
{
    public function testRun()
    {
        $node = Node::generateTemplate(NodeType::TeamshareMultiTableAddRecord);
        $node->setParams(json_decode(<<<'JSON'
{
        "operator": "developer",
        "file_id": "707616424235442176",
        "sheet_id": "508907118527590400",
        "columns": {
            "wcQEEhBw": {
                "id": "component-66470a8b548c4",
                "version": "1",
                "type": "value",
                "structure": {
                    "type": "expression",
                    "const_value": null,
                    "expression_value": [
                        {
                            "type": "fields",
                            "value": "MAGIC-FLOW-NODE-66470927a3dad8-78344215.content",
                            "name": "",
                            "args": null
                        }
                    ]
                }
            },
            "4LYzPzwA": {
                "id": "component-66470a8b548c1",
                "version": "1",
                "type": "value",
                "structure": {
                    "type": "const",
                    "const_value": [
                        {
                            "type": "member",
                            "member_value": [
                                {
                                    "id": "usi_a450dd07688be6273b5ef112ad50ba7e"
                                },
                                {
                                    "id": "usi_eb3a4884d3dda84e9a8d8644e9365c2c"
                                }
                            ]
                        }
                    ],
                    "expression_value": null
                }
            },
            "8tNU7rpp": {
                "id": "component-66470a8b548c2",
                "version": "1",
                "type": "value",
                "structure": {
                    "type": "const",
                    "const_value": [
                        {
                            "type": "input",
                            "value": "888.88"
                        }
                    ],
                    "expression_value": null
                }
            },
            "kH62P8QN": {
                "id": "component-66470a8b548c3",
                "version": "1",
                "type": "value",
                "structure": {
                    "type": "const",
                    "const_value": [
                        {
                            "type": "input",
                            "value": "https://www.baidu.com"
                        }
                    ],
                    "expression_value": null
                }
            },
            "n2clDVas": {
                "id": "component-66470a8b548c5",
                "version": "1",
                "type": "value",
                "structure": {
                    "type": "const",
                    "const_value": [
                        {
                            "type": "datetime",
                            "datetime_value": {
                                "type": "today",
                                "value": ""
                            }
                        }
                    ],
                    "expression_value": null
                }
            },
            "ArFQvflb": {
                "id": "component-66470a8b548c6",
                "version": "1",
                "type": "value",
                "structure": {
                    "type": "expression",
                    "const_value": null,
                    "expression_value": [
                        {
                            "type": "fields",
                            "value": "MAGIC-FLOW-NODE-66470927a3dad8-78344215.multiple",
                            "name": "",
                            "args": null
                        }
                    ]
                }
            },
            "jykMlY44": {
                "id": "component-66470a8b548c7",
                "version": "1",
                "type": "value",
                "structure": {
                    "type": "expression",
                    "const_value": null,
                    "expression_value": [
                        {
                            "type": "fields",
                            "value": "MAGIC-FLOW-NODE-66470927a3dad8-78344215.select",
                            "name": "",
                            "args": null
                        }
                    ]
                }
            },
            "0upYZ4vr": {
                "id": "component-66470a8b548c7",
                "version": "1",
                "type": "value",
                "structure": {
                    "type": "const",
                    "const_value": [
                        {
                            "type": "checkbox",
                            "checkbox_value": true
                        }
                    ],
                    "expression_value": null
                }
            }
        }
    }
JSON, true));
        $output = new NodeOutput();
        $output->setForm(ComponentFactory::generateTemplate(StructureType::Form));
        $node->setOutput($output);

        //        $node->setCallback(function (VertexResult $vertexResult, ExecutionData $executionData, array $fontResults) {
        //            $result = [
        //                'row_id' => 'row_id',
        //            ];
        //
        //            $vertexResult->setResult($result);
        //        });

        $runner = NodeRunnerFactory::make($node);
        $vertexResult = new VertexResult();
        $executionData = $this->createExecutionData();
        $executionData->saveNodeContext(
            'MAGIC-FLOW-NODE-66470927a3dad8-78344215',
            [
                'content' => '单测' . time(),
                'multiple' => [
                    'XAzMdy1729998437627',
                    'Hyl7dJ1729998444066',
                ],
                'select' => ['t34kIx1729998464212'],
            ]
        );
        $runner->execute($vertexResult, $executionData, []);
        $this->assertTrue($node->getNodeDebugResult()->isSuccess());
        $this->assertArrayHasKey('row_id', $vertexResult->getResult());
    }

    public function testRun1()
    {
        $node = Node::generateTemplate(NodeType::TeamshareMultiTableAddRecord);
        $node->setParams(json_decode(<<<'JSON'
{
        "operator": "developer",
        "file_id": "707616424235442176",
        "sheet_id": "508907118527590400",
        "columns": {
            "wcQEEhBw": {
                "id": "component-66470a8b548c4",
                "version": "1",
                "type": "value",
                "structure": {
                    "type": "expression",
                    "const_value": null,
                    "expression_value": [
                        {
                            "type": "fields",
                            "value": "MAGIC-FLOW-NODE-66470927a3dad8-78344215.content",
                            "name": "",
                            "args": null
                        }
                    ]
                }
            },
            "ArFQvflb": {
                "id": "component-66470a8b548c6",
                "version": "1",
                "type": "value",
                "structure": {
                    "type": "expression",
                    "const_value": null,
                    "expression_value": [
                        {
                            "type": "fields",
                            "value": "MAGIC-FLOW-NODE-66470927a3dad8-78344215.multiple",
                            "name": "",
                            "args": null
                        }
                    ]
                }
            },
            "jykMlY44": {
                "id": "component-66470a8b548c7",
                "version": "1",
                "type": "value",
                "structure": {
                    "type": "expression",
                    "const_value": null,
                    "expression_value": [
                        {
                            "type": "fields",
                            "value": "MAGIC-FLOW-NODE-66470927a3dad8-78344215.select",
                            "name": "",
                            "args": null
                        }
                    ]
                }
            }
        }
    }
JSON, true));
        $output = new NodeOutput();
        $output->setForm(ComponentFactory::generateTemplate(StructureType::Form));
        $node->setOutput($output);

        $runner = NodeRunnerFactory::make($node);
        $vertexResult = new VertexResult();
        $executionData = $this->createExecutionData();
        $executionData->saveNodeContext(
            'MAGIC-FLOW-NODE-66470927a3dad8-78344215',
            [
                'content' => '单测' . time(),
                'multiple' => [
                    'P1',
                    'P2',
                ],
                'select' => ['A'],
            ]
        );
        $runner->execute($vertexResult, $executionData, []);
        $this->assertTrue($node->getNodeDebugResult()->isSuccess());
        $this->assertArrayHasKey('row_id', $vertexResult->getResult());
    }
}
