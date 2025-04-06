<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace HyperfTest\Cases\Application\Flow\ExecuteManager\NodeRunner\TeamshareMultiTable;

use App\Application\Flow\ExecuteManager\ExecutionData\ExecutionData;
use App\Application\Flow\ExecuteManager\MagicFlowExecutor;
use App\Domain\Flow\Entity\ValueObject\Node;
use App\Domain\Flow\Entity\ValueObject\NodeType;
use App\Infrastructure\Core\Dag\VertexResult;
use HyperfTest\Cases\Application\Flow\ExecuteManager\ExecuteManagerBaseTest;

/**
 * @internal
 */
class TeamshareMultiTableUpdateRecordNodeRunnerTest extends ExecuteManagerBaseTest
{
    public function testRun()
    {
        $node = Node::generateTemplate(NodeType::TeamshareMultiTableUpdateRecord);
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
                                    "id": "606446434040061952"
                                },
                                {
                                    "id": "606488063299981312"
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
        },
        "filters": [
            {
                "column_id": "id",
                "operator": "=",
                "value": {
                    "id": "component-66470a8b548c4",
                    "version": "1",
                    "type": "value",
                    "structure": {
                        "type": "expression",
                        "const_value": null,
                        "expression_value": [
                            {
                                "type": "fields",
                                "value": "MAGIC-FLOW-NODE-66470927a3dad8-78344215.id",
                                "name": "",
                                "args": null
                            }
                        ]
                    }
                }
            }
        ],
        "select_record_type": 1,
        "filter_type": 0
    }
JSON, true));

        $node->validate();

        $node->setCallback(function (VertexResult $vertexResult, ExecutionData $executionData, array $fontResults) {
            $result = [
                'row_id' => 'row_id',
            ];

            $vertexResult->setResult($result);
        });

        $runner = MagicFlowExecutor::getNodeRunner($node);
        $vertexResult = new VertexResult();
        $executionData = $this->createExecutionData();
        $executionData->saveNodeContext(
            'MAGIC-FLOW-NODE-66470927a3dad8-78344215',
            [
                'id' => 'gFWmLnjr',
                'content' => '单测更改' . time(),
                'multiple' => [
                    'XAzMdy1729998437627',
                    'Hyl7dJ1729998444066',
                ],
                'select' => ['t34kIx1729998464212'],
            ]
        );
        $runner->execute($vertexResult, $executionData, []);
        $this->assertTrue($node->getNodeDebugResult()->isSuccess());
    }
}
