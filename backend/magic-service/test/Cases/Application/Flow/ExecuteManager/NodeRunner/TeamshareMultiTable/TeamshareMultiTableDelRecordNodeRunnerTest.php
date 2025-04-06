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
class TeamshareMultiTableDelRecordNodeRunnerTest extends ExecuteManagerBaseTest
{
    public function testRun()
    {
        $node = Node::generateTemplate(NodeType::TeamshareMultiTableDeleteRecord);
        $node->setParams(json_decode(<<<'JSON'
{
    "file_id": "707616424235442176",
    "sheet_id": "508907118527590400",
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
            $result = [];
            $vertexResult->setResult($result);
        });

        $runner = MagicFlowExecutor::getNodeRunner($node);
        $vertexResult = new VertexResult();
        $executionData = $this->createExecutionData();
        $executionData->saveNodeContext(
            'MAGIC-FLOW-NODE-66470927a3dad8-78344215',
            [
                'id' => 'mO0MmUQi',
            ]
        );
        $runner->execute($vertexResult, $executionData, []);
        $this->assertTrue($node->getNodeDebugResult()->isSuccess());
    }
}
