<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace HyperfTest\Cases\Application\Flow\ExecuteManager;

use App\Application\Flow\ExecuteManager\ExecutionData\ExecutionData;
use App\Application\Flow\ExecuteManager\ExecutionData\ExecutionType;
use App\Application\Flow\ExecuteManager\ExecutionData\TriggerData;
use App\Application\Flow\ExecuteManager\MagicFlowExecutor;
use App\Domain\Chat\DTO\Message\ChatMessage\TextMessage;
use App\Domain\Flow\Entity\MagicFlowEntity;
use App\Domain\Flow\Entity\ValueObject\Node;
use App\Domain\Flow\Entity\ValueObject\NodeParamsConfig\Start\Structure\TriggerType;
use App\Domain\Flow\Entity\ValueObject\NodeType;
use App\Domain\Flow\Entity\ValueObject\Type;
use App\Domain\Flow\Factory\MagicFlowFactory;
use App\Infrastructure\Core\Dag\VertexResult;
use DateTime;

/**
 * @internal
 */
class MagicFlowExecutorTest extends ExecuteManagerBaseTest
{
    public function testRun()
    {
        $nodes = [];
        $nodeTypes = NodeType::cases();
        foreach ($nodeTypes as $i => $nodeType) {
            $node = new Node($nodeType);
            $node->setNodeId('node_' . $i);
            $node->setName($nodeType->name);
            if (isset($nodeTypes[$i + 1])) {
                $node->setNextNodes(['node_' . ($i + 1)]);
            }
            $node->setCallback(function (VertexResult $vertexResult, ExecutionData $executionData, array $frontResults) {});
            $nodes[$i] = $node;
        }
        $magicFlowEntity = $this->getMagicFlowEntity();
        $magicFlowEntity->setNodes($nodes);

        $executionData = $this->createExecutionData(TriggerType::ChatMessage);
        $executor = new MagicFlowExecutor($magicFlowEntity, $executionData);

        $executor->execute();
        foreach ($nodes as $node) {
            $this->assertTrue($node->getNodeDebugResult()->isSuccess());
        }
    }

    public function testSimpleChat()
    {
        $magicFlowEntity = MagicFlowFactory::arrayToEntity(json_decode(
            <<<'JSON'
{
    "id": 1,
    "organization_code": "DT001",
    "code": "MAGIC-FLOW-67a48e5974c478-91744231",
    "name": "李海清的 chatgpt 助理",
    "description": "李海清的 chatgpt 助理",
    "icon": "https://teamshareos-app-public-test.tos-cn-beijing.volces.com/DT001/588417216353927169/4c9184f37cff01bcdc32dc486ec36961/6jB3xdlYNCeSDeGmA0r1s.png",
    "type": 1,
    "tool_set_id": "not_grouped",
    "edges": [
        {
            "id": "547363472376799232",
            "data": {
                "allowAddOnLine": true
            },
            "type": "commonEdge",
            "style": {
                "stroke": "#4d53e8",
                "strokeWidth": 2
            },
            "source": "547363440672055296",
            "target": "547363472049643520",
            "markerEnd": {
                "type": "arrow",
                "width": 20,
                "height": 20,
                "color": "#4d53e8"
            },
            "sourceHandle": "branch_677d3b00a34de"
        },
        {
            "id": "547363492094222336",
            "data": {
                "allowAddOnLine": true
            },
            "type": "commonEdge",
            "style": {
                "stroke": "#4d53e8",
                "strokeWidth": 2
            },
            "source": "547363472049643520",
            "target": "547363491909672960",
            "markerEnd": {
                "type": "arrow",
                "width": 20,
                "height": 20,
                "color": "#4d53e8"
            }
        }
    ],
    "nodes": [
        {
            "node_id": "547363440672055296",
            "debug": false,
            "name": "开始节点",
            "description": "",
            "node_type": 1,
            "node_version": "v1",
            "meta": {
                "position": {
                    "x": -50,
                    "y": 52
                }
            },
            "params": {
                "branches": [
                    {
                        "branch_id": "branch_677d3b00a34de",
                        "trigger_type": 1,
                        "next_nodes": [
                            "547363472049643520"
                        ],
                        "config": [

                        ],
                        "input": {
                            "widget": null,
                            "form": null
                        },
                        "output": {
                            "widget": null,
                            "form": {
                                "id": "component-67a6c20866812",
                                "version": "1",
                                "type": "form",
                                "structure": {
                                    "type": "object",
                                    "key": "root",
                                    "sort": 0,
                                    "title": "root节点",
                                    "description": "",
                                    "required": [
                                        "conversation_id",
                                        "topic_id",
                                        "message_content",
                                        "message_type",
                                        "message_time",
                                        "organization_code",
                                        "user"
                                    ],
                                    "value": null,
                                    "encryption": false,
                                    "encryption_value": null,
                                    "items": null,
                                    "properties": {
                                        "conversation_id": {
                                            "type": "string",
                                            "key": "conversation_id",
                                            "sort": 0,
                                            "title": "会话 ID",
                                            "description": "",
                                            "required": null,
                                            "value": null,
                                            "encryption": false,
                                            "encryption_value": null,
                                            "items": null,
                                            "properties": null
                                        },
                                        "topic_id": {
                                            "type": "string",
                                            "key": "topic_id",
                                            "sort": 1,
                                            "title": "话题 ID",
                                            "description": "",
                                            "required": null,
                                            "value": null,
                                            "encryption": false,
                                            "encryption_value": null,
                                            "items": null,
                                            "properties": null
                                        },
                                        "message_content": {
                                            "type": "string",
                                            "key": "message_content",
                                            "sort": 2,
                                            "title": "消息内容",
                                            "description": "",
                                            "required": null,
                                            "value": null,
                                            "encryption": false,
                                            "encryption_value": null,
                                            "items": null,
                                            "properties": null
                                        },
                                        "message_type": {
                                            "type": "string",
                                            "key": "message_type",
                                            "sort": 3,
                                            "title": "消息类型",
                                            "description": "",
                                            "required": null,
                                            "value": null,
                                            "encryption": false,
                                            "encryption_value": null,
                                            "items": null,
                                            "properties": null
                                        },
                                        "message_time": {
                                            "type": "string",
                                            "key": "message_time",
                                            "sort": 4,
                                            "title": "发送时间",
                                            "description": "",
                                            "required": null,
                                            "value": null,
                                            "encryption": false,
                                            "encryption_value": null,
                                            "items": null,
                                            "properties": null
                                        },
                                        "organization_code": {
                                            "type": "string",
                                            "key": "organization_code",
                                            "sort": 5,
                                            "title": "组织编码",
                                            "description": "",
                                            "required": null,
                                            "value": null,
                                            "encryption": false,
                                            "encryption_value": null,
                                            "items": null,
                                            "properties": null
                                        },
                                        "files": {
                                            "type": "array",
                                            "key": "files",
                                            "sort": 6,
                                            "title": "文件列表",
                                            "description": "",
                                            "required": null,
                                            "value": null,
                                            "encryption": false,
                                            "encryption_value": null,
                                            "items": {
                                                "type": "object",
                                                "key": "files",
                                                "sort": 0,
                                                "title": "文件",
                                                "description": "",
                                                "required": [
                                                    "name",
                                                    "url",
                                                    "extension",
                                                    "size"
                                                ],
                                                "value": null,
                                                "encryption": false,
                                                "encryption_value": null,
                                                "items": null,
                                                "properties": {
                                                    "name": {
                                                        "type": "string",
                                                        "key": "name",
                                                        "sort": 0,
                                                        "title": "文件名称",
                                                        "description": "",
                                                        "required": null,
                                                        "value": null,
                                                        "encryption": false,
                                                        "encryption_value": null,
                                                        "items": null,
                                                        "properties": null
                                                    },
                                                    "url": {
                                                        "type": "string",
                                                        "key": "url",
                                                        "sort": 1,
                                                        "title": "文件链接",
                                                        "description": "",
                                                        "required": null,
                                                        "value": null,
                                                        "encryption": false,
                                                        "encryption_value": null,
                                                        "items": null,
                                                        "properties": null
                                                    },
                                                    "extension": {
                                                        "type": "string",
                                                        "key": "extension",
                                                        "sort": 2,
                                                        "title": "文件扩展名",
                                                        "description": "",
                                                        "required": null,
                                                        "value": null,
                                                        "encryption": false,
                                                        "encryption_value": null,
                                                        "items": null,
                                                        "properties": null
                                                    },
                                                    "size": {
                                                        "type": "number",
                                                        "key": "size",
                                                        "sort": 3,
                                                        "title": "文件大小",
                                                        "description": "",
                                                        "required": null,
                                                        "value": null,
                                                        "encryption": false,
                                                        "encryption_value": null,
                                                        "items": null,
                                                        "properties": null
                                                    }
                                                }
                                            },
                                            "properties": null
                                        },
                                        "user": {
                                            "type": "object",
                                            "key": "user",
                                            "sort": 7,
                                            "title": "用户",
                                            "description": "",
                                            "required": [
                                                "id",
                                                "nickname",
                                                "real_name",
                                                "position",
                                                "phone_number",
                                                "work_number"
                                            ],
                                            "value": null,
                                            "encryption": false,
                                            "encryption_value": null,
                                            "items": null,
                                            "properties": {
                                                "id": {
                                                    "type": "string",
                                                    "key": "id",
                                                    "sort": 0,
                                                    "title": "用户 ID",
                                                    "description": "",
                                                    "required": null,
                                                    "value": null,
                                                    "encryption": false,
                                                    "encryption_value": null,
                                                    "items": null,
                                                    "properties": null
                                                },
                                                "nickname": {
                                                    "type": "string",
                                                    "key": "nickname",
                                                    "sort": 1,
                                                    "title": "用户昵称",
                                                    "description": "",
                                                    "required": null,
                                                    "value": null,
                                                    "encryption": false,
                                                    "encryption_value": null,
                                                    "items": null,
                                                    "properties": null
                                                },
                                                "real_name": {
                                                    "type": "string",
                                                    "key": "real_name",
                                                    "sort": 2,
                                                    "title": "真实姓名",
                                                    "description": "",
                                                    "required": null,
                                                    "value": null,
                                                    "encryption": false,
                                                    "encryption_value": null,
                                                    "items": null,
                                                    "properties": null
                                                },
                                                "position": {
                                                    "type": "string",
                                                    "key": "position",
                                                    "sort": 3,
                                                    "title": "岗位",
                                                    "description": "",
                                                    "required": null,
                                                    "value": null,
                                                    "encryption": false,
                                                    "encryption_value": null,
                                                    "items": null,
                                                    "properties": null
                                                },
                                                "work_number": {
                                                    "type": "string",
                                                    "key": "work_number",
                                                    "sort": 4,
                                                    "title": "工号",
                                                    "description": "",
                                                    "required": null,
                                                    "value": null,
                                                    "encryption": false,
                                                    "encryption_value": null,
                                                    "items": null,
                                                    "properties": null
                                                },
                                                "departments": {
                                                    "type": "array",
                                                    "key": "departments",
                                                    "sort": 5,
                                                    "title": "部门",
                                                    "description": "desc",
                                                    "required": null,
                                                    "value": null,
                                                    "encryption": false,
                                                    "encryption_value": null,
                                                    "items": {
                                                        "type": "object",
                                                        "key": "departments",
                                                        "sort": 0,
                                                        "title": "部门",
                                                        "description": "desc",
                                                        "required": [
                                                            "id",
                                                            "name",
                                                            "path"
                                                        ],
                                                        "value": null,
                                                        "encryption": false,
                                                        "encryption_value": null,
                                                        "items": null,
                                                        "properties": {
                                                            "id": {
                                                                "type": "string",
                                                                "key": "id",
                                                                "sort": 0,
                                                                "title": "部门 ID",
                                                                "description": "",
                                                                "required": null,
                                                                "value": null,
                                                                "encryption": false,
                                                                "encryption_value": null,
                                                                "items": null,
                                                                "properties": null
                                                            },
                                                            "name": {
                                                                "type": "string",
                                                                "key": "name",
                                                                "sort": 1,
                                                                "title": "部门名称",
                                                                "description": "",
                                                                "required": null,
                                                                "value": null,
                                                                "encryption": false,
                                                                "encryption_value": null,
                                                                "items": null,
                                                                "properties": null
                                                            },
                                                            "path": {
                                                                "type": "string",
                                                                "key": "path",
                                                                "sort": 2,
                                                                "title": "部门路径",
                                                                "description": "",
                                                                "required": null,
                                                                "value": null,
                                                                "encryption": false,
                                                                "encryption_value": null,
                                                                "items": null,
                                                                "properties": null
                                                            }
                                                        }
                                                    },
                                                    "properties": null
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        "system_output": null,
                        "custom_system_output": null
                    }
                ]
            },
            "next_nodes": [
                "547363472049643520"
            ],
            "input": null,
            "output": null,
            "system_output": null,
            "id": "547363440672055296"
        },
        {
            "node_id": "547363472049643520",
            "debug": false,
            "name": "大模型调用",
            "description": "",
            "node_type": 2,
            "node_version": "v1",
            "meta": {
                "position": {
                    "x": 580,
                    "y": 0.5
                }
            },
            "params": {
                "model": "gpt-4o-global",
                "system_prompt": {
                    "id": "component-677633dfaf2fc",
                    "version": "1",
                    "type": "value",
                    "structure": {
                        "type": "expression",
                        "const_value": null,
                        "expression_value": null
                    }
                },
                "user_prompt": {
                    "id": "component-677633dfaf31e",
                    "version": "1",
                    "type": "value",
                    "structure": {
                        "type": "expression",
                        "const_value": [

                        ],
                        "expression_value": [
                            {
                                "type": "input",
                                "uniqueId": "680240180099026945",
                                "value": ""
                            },
                            {
                                "type": "fields",
                                "uniqueId": "680240207693352960",
                                "value": "547363440672055296.message_content"
                            }
                        ]
                    }
                },
                "model_config": {
                    "auto_memory": false,
                    "max_record": 50,
                    "temperature": 0.5
                },
                "tools": [

                ],
                "option_tools": [

                ],
                "knowledge_config": {
                    "operator": "developer",
                    "knowledge_list": [

                    ],
                    "limit": 5,
                    "score": 0.4
                },
                "messages": {
                    "id": "component-677633dfaf338",
                    "version": "1",
                    "type": "form",
                    "structure": {
                        "type": "array",
                        "key": "root",
                        "sort": 0,
                        "title": "历史消息",
                        "description": "",
                        "required": null,
                        "value": null,
                        "encryption": false,
                        "encryption_value": null,
                        "items": {
                            "type": "object",
                            "key": "messages",
                            "sort": 0,
                            "title": "历史消息",
                            "description": "",
                            "required": [
                                "role",
                                "content"
                            ],
                            "value": null,
                            "encryption": false,
                            "encryption_value": null,
                            "items": null,
                            "properties": {
                                "role": {
                                    "type": "string",
                                    "key": "role",
                                    "sort": 0,
                                    "title": "角色",
                                    "description": "",
                                    "required": null,
                                    "value": null,
                                    "encryption": false,
                                    "encryption_value": null,
                                    "items": null,
                                    "properties": null
                                },
                                "content": {
                                    "type": "string",
                                    "key": "content",
                                    "sort": 1,
                                    "title": "内容",
                                    "description": "",
                                    "required": null,
                                    "value": null,
                                    "encryption": false,
                                    "encryption_value": null,
                                    "items": null,
                                    "properties": null
                                }
                            }
                        },
                        "properties": null
                    }
                }
            },
            "next_nodes": [
                "547363491909672960"
            ],
            "input": null,
            "output": {
                "widget": null,
                "form": {
                    "id": "component-677633dfaf392",
                    "version": "1",
                    "type": "form",
                    "structure": {
                        "key": "root",
                        "sort": 0,
                        "type": "object",
                        "items": null,
                        "title": "root节点",
                        "value": null,
                        "required": [
                            "response",
                            "tool_calls"
                        ],
                        "encryption": false,
                        "properties": {
                            "response": {
                                "key": "response",
                                "sort": 0,
                                "type": "string",
                                "items": null,
                                "title": "大模型响应",
                                "value": null,
                                "required": null,
                                "encryption": false,
                                "properties": null,
                                "description": "",
                                "encryption_value": null
                            },
                            "tool_calls": {
                                "key": "tool_calls",
                                "sort": 1,
                                "type": "array",
                                "items": {
                                    "key": "",
                                    "sort": 0,
                                    "type": "object",
                                    "items": null,
                                    "title": "调用过的工具",
                                    "value": null,
                                    "required": [

                                    ],
                                    "encryption": false,
                                    "properties": {
                                        "name": {
                                            "key": "name",
                                            "sort": 0,
                                            "type": "string",
                                            "items": null,
                                            "title": "工具名称",
                                            "value": null,
                                            "required": null,
                                            "encryption": false,
                                            "properties": null,
                                            "description": "",
                                            "encryption_value": null
                                        },
                                        "success": {
                                            "key": "success",
                                            "sort": 1,
                                            "type": "boolean",
                                            "items": null,
                                            "title": "是否成功",
                                            "value": null,
                                            "required": null,
                                            "encryption": false,
                                            "properties": null,
                                            "description": "",
                                            "encryption_value": null
                                        },
                                        "arguments": {
                                            "key": "arguments",
                                            "sort": 3,
                                            "type": "object",
                                            "items": null,
                                            "title": "工具参数",
                                            "value": null,
                                            "required": [

                                            ],
                                            "encryption": false,
                                            "properties": null,
                                            "description": "",
                                            "encryption_value": null
                                        },
                                        "call_result": {
                                            "key": "call_result",
                                            "sort": 4,
                                            "type": "string",
                                            "items": null,
                                            "title": "调用结果",
                                            "value": null,
                                            "required": null,
                                            "encryption": false,
                                            "properties": null,
                                            "description": "",
                                            "encryption_value": null
                                        },
                                        "elapsed_time": {
                                            "key": "elapsed_time",
                                            "sort": 5,
                                            "type": "string",
                                            "items": null,
                                            "title": "耗时",
                                            "value": null,
                                            "required": null,
                                            "encryption": false,
                                            "properties": null,
                                            "description": "",
                                            "encryption_value": null
                                        },
                                        "error_message": {
                                            "key": "error_message",
                                            "sort": 2,
                                            "type": "string",
                                            "items": null,
                                            "title": "错误信息",
                                            "value": null,
                                            "required": null,
                                            "encryption": false,
                                            "properties": null,
                                            "description": "",
                                            "encryption_value": null
                                        }
                                    },
                                    "description": "",
                                    "encryption_value": null
                                },
                                "title": "调用过的工具",
                                "value": null,
                                "required": null,
                                "encryption": false,
                                "properties": null,
                                "description": "",
                                "encryption_value": null
                            }
                        },
                        "description": "",
                        "encryption_value": null
                    }
                }
            },
            "system_output": null,
            "id": "547363472049643520"
        },
        {
            "node_id": "547363491909672960",
            "debug": false,
            "name": "消息回复",
            "description": "",
            "node_type": 3,
            "node_version": "v0",
            "meta": {
                "position": {
                    "x": 1280,
                    "y": 379
                }
            },
            "params": {
                "type": "text",
                "content": {
                    "id": "component-663c6d64b33d4",
                    "version": "1",
                    "type": "value",
                    "structure": {
                        "type": "expression",
                        "const_value": null,
                        "expression_value": [
                            {
                                "type": "fields",
                                "value": "547363472049643520.response",
                                "name": "",
                                "args": null
                            }
                        ]
                    }
                },
                "link": {
                    "id": "component-663c6d64b33ed",
                    "version": "1",
                    "type": "value",
                    "structure": {
                        "type": "expression",
                        "const_value": null,
                        "expression_value": null
                    }
                },
                "link_desc": {
                    "id": "component-663c6d64b33f4",
                    "version": "1",
                    "type": "value",
                    "structure": {
                        "type": "expression",
                        "const_value": null,
                        "expression_value": null
                    }
                },
                "recipients": null
            },
            "next_nodes": [

            ],
            "input": null,
            "output": null,
            "system_output": null,
            "id": "547363491909672960"
        }
    ],
    "global_variable": null,
    "enabled": true,
    "version_code": "",
    "creator": "usi_a450dd07688be6273b5ef112ad50ba7e",
    "created_at": "2025-02-06 18:27:22",
    "modifier": "usi_a450dd07688be6273b5ef112ad50ba7e",
    "updated_at": "2025-02-06 18:27:22"
}
JSON
            ,
            true
        ));

        $operator = $this->getOperator();
        $triggerData = new TriggerData(
            triggerTime: new DateTime(),
            userInfo: ['user_entity' => TriggerData::createUserEntity($operator->getUid(), $operator->getNickname(), $operator->getOrganizationCode())],
            messageInfo: ['message_entity' => TriggerData::createMessageEntity(new TextMessage(['content' => '你好']))],
            params: [],
        );

        $executionData = $this->createExecutionData(triggerType: TriggerType::ChatMessage, triggerData: $triggerData, executionType: ExecutionType::IMChat);
        $executor = new MagicFlowExecutor($magicFlowEntity, $executionData);
        $executor->execute();
        $this->assertTrue($executor->isSuccess());
    }

    public function testSimpleChatBreakpointRetry()
    {
        $magicFlowEntity = MagicFlowFactory::arrayToEntity(json_decode(
            <<<'JSON'
{
    "id": 1,
    "organization_code": "DT001",
    "code": "MAGIC-FLOW-67a48e5974c478-91744231",
    "name": "李海清的 chatgpt 助理",
    "description": "李海清的 chatgpt 助理",
    "icon": "https://teamshareos-app-public-test.tos-cn-beijing.volces.com/DT001/588417216353927169/4c9184f37cff01bcdc32dc486ec36961/6jB3xdlYNCeSDeGmA0r1s.png",
    "type": 1,
    "tool_set_id": "not_grouped",
    "edges": [
        {
            "id": "547363472376799232",
            "data": {
                "allowAddOnLine": true
            },
            "type": "commonEdge",
            "style": {
                "stroke": "#4d53e8",
                "strokeWidth": 2
            },
            "source": "547363440672055296",
            "target": "547363472049643520",
            "markerEnd": {
                "type": "arrow",
                "width": 20,
                "height": 20,
                "color": "#4d53e8"
            },
            "sourceHandle": "branch_677d3b00a34de"
        },
        {
            "id": "547363492094222336",
            "data": {
                "allowAddOnLine": true
            },
            "type": "commonEdge",
            "style": {
                "stroke": "#4d53e8",
                "strokeWidth": 2
            },
            "source": "547363472049643520",
            "target": "547363491909672960",
            "markerEnd": {
                "type": "arrow",
                "width": 20,
                "height": 20,
                "color": "#4d53e8"
            }
        }
    ],
    "nodes": [
        {
            "node_id": "547363440672055296",
            "debug": false,
            "name": "开始节点",
            "description": "",
            "node_type": 1,
            "node_version": "v1",
            "meta": {
                "position": {
                    "x": -50,
                    "y": 52
                }
            },
            "params": {
                "branches": [
                    {
                        "branch_id": "branch_677d3b00a34de",
                        "trigger_type": 1,
                        "next_nodes": [
                            "547363472049643520"
                        ],
                        "config": [

                        ],
                        "input": {
                            "widget": null,
                            "form": null
                        },
                        "output": {
                            "widget": null,
                            "form": {
                                "id": "component-67a6c20866812",
                                "version": "1",
                                "type": "form",
                                "structure": {
                                    "type": "object",
                                    "key": "root",
                                    "sort": 0,
                                    "title": "root节点",
                                    "description": "",
                                    "required": [
                                        "conversation_id",
                                        "topic_id",
                                        "message_content",
                                        "message_type",
                                        "message_time",
                                        "organization_code",
                                        "user"
                                    ],
                                    "value": null,
                                    "encryption": false,
                                    "encryption_value": null,
                                    "items": null,
                                    "properties": {
                                        "conversation_id": {
                                            "type": "string",
                                            "key": "conversation_id",
                                            "sort": 0,
                                            "title": "会话 ID",
                                            "description": "",
                                            "required": null,
                                            "value": null,
                                            "encryption": false,
                                            "encryption_value": null,
                                            "items": null,
                                            "properties": null
                                        },
                                        "topic_id": {
                                            "type": "string",
                                            "key": "topic_id",
                                            "sort": 1,
                                            "title": "话题 ID",
                                            "description": "",
                                            "required": null,
                                            "value": null,
                                            "encryption": false,
                                            "encryption_value": null,
                                            "items": null,
                                            "properties": null
                                        },
                                        "message_content": {
                                            "type": "string",
                                            "key": "message_content",
                                            "sort": 2,
                                            "title": "消息内容",
                                            "description": "",
                                            "required": null,
                                            "value": null,
                                            "encryption": false,
                                            "encryption_value": null,
                                            "items": null,
                                            "properties": null
                                        },
                                        "message_type": {
                                            "type": "string",
                                            "key": "message_type",
                                            "sort": 3,
                                            "title": "消息类型",
                                            "description": "",
                                            "required": null,
                                            "value": null,
                                            "encryption": false,
                                            "encryption_value": null,
                                            "items": null,
                                            "properties": null
                                        },
                                        "message_time": {
                                            "type": "string",
                                            "key": "message_time",
                                            "sort": 4,
                                            "title": "发送时间",
                                            "description": "",
                                            "required": null,
                                            "value": null,
                                            "encryption": false,
                                            "encryption_value": null,
                                            "items": null,
                                            "properties": null
                                        },
                                        "organization_code": {
                                            "type": "string",
                                            "key": "organization_code",
                                            "sort": 5,
                                            "title": "组织编码",
                                            "description": "",
                                            "required": null,
                                            "value": null,
                                            "encryption": false,
                                            "encryption_value": null,
                                            "items": null,
                                            "properties": null
                                        },
                                        "files": {
                                            "type": "array",
                                            "key": "files",
                                            "sort": 6,
                                            "title": "文件列表",
                                            "description": "",
                                            "required": null,
                                            "value": null,
                                            "encryption": false,
                                            "encryption_value": null,
                                            "items": {
                                                "type": "object",
                                                "key": "files",
                                                "sort": 0,
                                                "title": "文件",
                                                "description": "",
                                                "required": [
                                                    "name",
                                                    "url",
                                                    "extension",
                                                    "size"
                                                ],
                                                "value": null,
                                                "encryption": false,
                                                "encryption_value": null,
                                                "items": null,
                                                "properties": {
                                                    "name": {
                                                        "type": "string",
                                                        "key": "name",
                                                        "sort": 0,
                                                        "title": "文件名称",
                                                        "description": "",
                                                        "required": null,
                                                        "value": null,
                                                        "encryption": false,
                                                        "encryption_value": null,
                                                        "items": null,
                                                        "properties": null
                                                    },
                                                    "url": {
                                                        "type": "string",
                                                        "key": "url",
                                                        "sort": 1,
                                                        "title": "文件链接",
                                                        "description": "",
                                                        "required": null,
                                                        "value": null,
                                                        "encryption": false,
                                                        "encryption_value": null,
                                                        "items": null,
                                                        "properties": null
                                                    },
                                                    "extension": {
                                                        "type": "string",
                                                        "key": "extension",
                                                        "sort": 2,
                                                        "title": "文件扩展名",
                                                        "description": "",
                                                        "required": null,
                                                        "value": null,
                                                        "encryption": false,
                                                        "encryption_value": null,
                                                        "items": null,
                                                        "properties": null
                                                    },
                                                    "size": {
                                                        "type": "number",
                                                        "key": "size",
                                                        "sort": 3,
                                                        "title": "文件大小",
                                                        "description": "",
                                                        "required": null,
                                                        "value": null,
                                                        "encryption": false,
                                                        "encryption_value": null,
                                                        "items": null,
                                                        "properties": null
                                                    }
                                                }
                                            },
                                            "properties": null
                                        },
                                        "user": {
                                            "type": "object",
                                            "key": "user",
                                            "sort": 7,
                                            "title": "用户",
                                            "description": "",
                                            "required": [
                                                "id",
                                                "nickname",
                                                "real_name",
                                                "position",
                                                "phone_number",
                                                "work_number"
                                            ],
                                            "value": null,
                                            "encryption": false,
                                            "encryption_value": null,
                                            "items": null,
                                            "properties": {
                                                "id": {
                                                    "type": "string",
                                                    "key": "id",
                                                    "sort": 0,
                                                    "title": "用户 ID",
                                                    "description": "",
                                                    "required": null,
                                                    "value": null,
                                                    "encryption": false,
                                                    "encryption_value": null,
                                                    "items": null,
                                                    "properties": null
                                                },
                                                "nickname": {
                                                    "type": "string",
                                                    "key": "nickname",
                                                    "sort": 1,
                                                    "title": "用户昵称",
                                                    "description": "",
                                                    "required": null,
                                                    "value": null,
                                                    "encryption": false,
                                                    "encryption_value": null,
                                                    "items": null,
                                                    "properties": null
                                                },
                                                "real_name": {
                                                    "type": "string",
                                                    "key": "real_name",
                                                    "sort": 2,
                                                    "title": "真实姓名",
                                                    "description": "",
                                                    "required": null,
                                                    "value": null,
                                                    "encryption": false,
                                                    "encryption_value": null,
                                                    "items": null,
                                                    "properties": null
                                                },
                                                "position": {
                                                    "type": "string",
                                                    "key": "position",
                                                    "sort": 3,
                                                    "title": "岗位",
                                                    "description": "",
                                                    "required": null,
                                                    "value": null,
                                                    "encryption": false,
                                                    "encryption_value": null,
                                                    "items": null,
                                                    "properties": null
                                                },
                                                "work_number": {
                                                    "type": "string",
                                                    "key": "work_number",
                                                    "sort": 4,
                                                    "title": "工号",
                                                    "description": "",
                                                    "required": null,
                                                    "value": null,
                                                    "encryption": false,
                                                    "encryption_value": null,
                                                    "items": null,
                                                    "properties": null
                                                },
                                                "departments": {
                                                    "type": "array",
                                                    "key": "departments",
                                                    "sort": 5,
                                                    "title": "部门",
                                                    "description": "desc",
                                                    "required": null,
                                                    "value": null,
                                                    "encryption": false,
                                                    "encryption_value": null,
                                                    "items": {
                                                        "type": "object",
                                                        "key": "departments",
                                                        "sort": 0,
                                                        "title": "部门",
                                                        "description": "desc",
                                                        "required": [
                                                            "id",
                                                            "name",
                                                            "path"
                                                        ],
                                                        "value": null,
                                                        "encryption": false,
                                                        "encryption_value": null,
                                                        "items": null,
                                                        "properties": {
                                                            "id": {
                                                                "type": "string",
                                                                "key": "id",
                                                                "sort": 0,
                                                                "title": "部门 ID",
                                                                "description": "",
                                                                "required": null,
                                                                "value": null,
                                                                "encryption": false,
                                                                "encryption_value": null,
                                                                "items": null,
                                                                "properties": null
                                                            },
                                                            "name": {
                                                                "type": "string",
                                                                "key": "name",
                                                                "sort": 1,
                                                                "title": "部门名称",
                                                                "description": "",
                                                                "required": null,
                                                                "value": null,
                                                                "encryption": false,
                                                                "encryption_value": null,
                                                                "items": null,
                                                                "properties": null
                                                            },
                                                            "path": {
                                                                "type": "string",
                                                                "key": "path",
                                                                "sort": 2,
                                                                "title": "部门路径",
                                                                "description": "",
                                                                "required": null,
                                                                "value": null,
                                                                "encryption": false,
                                                                "encryption_value": null,
                                                                "items": null,
                                                                "properties": null
                                                            }
                                                        }
                                                    },
                                                    "properties": null
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        "system_output": null,
                        "custom_system_output": null
                    }
                ]
            },
            "next_nodes": [
                "547363472049643520"
            ],
            "input": null,
            "output": null,
            "system_output": null,
            "id": "547363440672055296"
        },
        {
            "node_id": "547363472049643520",
            "debug": false,
            "name": "大模型调用",
            "description": "",
            "node_type": 2,
            "node_version": "v1",
            "meta": {
                "position": {
                    "x": 580,
                    "y": 0.5
                }
            },
            "params": {
                "model": "gpt-4o-global",
                "system_prompt": {
                    "id": "component-677633dfaf2fc",
                    "version": "1",
                    "type": "value",
                    "structure": {
                        "type": "expression",
                        "const_value": null,
                        "expression_value": null
                    }
                },
                "user_prompt": {
                    "id": "component-677633dfaf31e",
                    "version": "1",
                    "type": "value",
                    "structure": {
                        "type": "expression",
                        "const_value": [

                        ],
                        "expression_value": [
                            {
                                "type": "input",
                                "uniqueId": "680240180099026945",
                                "value": ""
                            },
                            {
                                "type": "fields",
                                "uniqueId": "680240207693352960",
                                "value": "547363440672055296.message_content"
                            }
                        ]
                    }
                },
                "model_config": {
                    "auto_memory": false,
                    "max_record": 50,
                    "temperature": 0.5
                },
                "tools": [

                ],
                "option_tools": [

                ],
                "knowledge_config": {
                    "operator": "developer",
                    "knowledge_list": [

                    ],
                    "limit": 5,
                    "score": 0.4
                },
                "messages": {
                    "id": "component-677633dfaf338",
                    "version": "1",
                    "type": "form",
                    "structure": {
                        "type": "array",
                        "key": "root",
                        "sort": 0,
                        "title": "历史消息",
                        "description": "",
                        "required": null,
                        "value": null,
                        "encryption": false,
                        "encryption_value": null,
                        "items": {
                            "type": "object",
                            "key": "messages",
                            "sort": 0,
                            "title": "历史消息",
                            "description": "",
                            "required": [
                                "role",
                                "content"
                            ],
                            "value": null,
                            "encryption": false,
                            "encryption_value": null,
                            "items": null,
                            "properties": {
                                "role": {
                                    "type": "string",
                                    "key": "role",
                                    "sort": 0,
                                    "title": "角色",
                                    "description": "",
                                    "required": null,
                                    "value": null,
                                    "encryption": false,
                                    "encryption_value": null,
                                    "items": null,
                                    "properties": null
                                },
                                "content": {
                                    "type": "string",
                                    "key": "content",
                                    "sort": 1,
                                    "title": "内容",
                                    "description": "",
                                    "required": null,
                                    "value": null,
                                    "encryption": false,
                                    "encryption_value": null,
                                    "items": null,
                                    "properties": null
                                }
                            }
                        },
                        "properties": null
                    }
                }
            },
            "next_nodes": [
                "547363491909672960"
            ],
            "input": null,
            "output": {
                "widget": null,
                "form": {
                    "id": "component-677633dfaf392",
                    "version": "1",
                    "type": "form",
                    "structure": {
                        "key": "root",
                        "sort": 0,
                        "type": "object",
                        "items": null,
                        "title": "root节点",
                        "value": null,
                        "required": [
                            "response",
                            "tool_calls"
                        ],
                        "encryption": false,
                        "properties": {
                            "response": {
                                "key": "response",
                                "sort": 0,
                                "type": "string",
                                "items": null,
                                "title": "大模型响应",
                                "value": null,
                                "required": null,
                                "encryption": false,
                                "properties": null,
                                "description": "",
                                "encryption_value": null
                            },
                            "tool_calls": {
                                "key": "tool_calls",
                                "sort": 1,
                                "type": "array",
                                "items": {
                                    "key": "",
                                    "sort": 0,
                                    "type": "object",
                                    "items": null,
                                    "title": "调用过的工具",
                                    "value": null,
                                    "required": [

                                    ],
                                    "encryption": false,
                                    "properties": {
                                        "name": {
                                            "key": "name",
                                            "sort": 0,
                                            "type": "string",
                                            "items": null,
                                            "title": "工具名称",
                                            "value": null,
                                            "required": null,
                                            "encryption": false,
                                            "properties": null,
                                            "description": "",
                                            "encryption_value": null
                                        },
                                        "success": {
                                            "key": "success",
                                            "sort": 1,
                                            "type": "boolean",
                                            "items": null,
                                            "title": "是否成功",
                                            "value": null,
                                            "required": null,
                                            "encryption": false,
                                            "properties": null,
                                            "description": "",
                                            "encryption_value": null
                                        },
                                        "arguments": {
                                            "key": "arguments",
                                            "sort": 3,
                                            "type": "object",
                                            "items": null,
                                            "title": "工具参数",
                                            "value": null,
                                            "required": [

                                            ],
                                            "encryption": false,
                                            "properties": null,
                                            "description": "",
                                            "encryption_value": null
                                        },
                                        "call_result": {
                                            "key": "call_result",
                                            "sort": 4,
                                            "type": "string",
                                            "items": null,
                                            "title": "调用结果",
                                            "value": null,
                                            "required": null,
                                            "encryption": false,
                                            "properties": null,
                                            "description": "",
                                            "encryption_value": null
                                        },
                                        "elapsed_time": {
                                            "key": "elapsed_time",
                                            "sort": 5,
                                            "type": "string",
                                            "items": null,
                                            "title": "耗时",
                                            "value": null,
                                            "required": null,
                                            "encryption": false,
                                            "properties": null,
                                            "description": "",
                                            "encryption_value": null
                                        },
                                        "error_message": {
                                            "key": "error_message",
                                            "sort": 2,
                                            "type": "string",
                                            "items": null,
                                            "title": "错误信息",
                                            "value": null,
                                            "required": null,
                                            "encryption": false,
                                            "properties": null,
                                            "description": "",
                                            "encryption_value": null
                                        }
                                    },
                                    "description": "",
                                    "encryption_value": null
                                },
                                "title": "调用过的工具",
                                "value": null,
                                "required": null,
                                "encryption": false,
                                "properties": null,
                                "description": "",
                                "encryption_value": null
                            }
                        },
                        "description": "",
                        "encryption_value": null
                    }
                }
            },
            "system_output": null,
            "id": "547363472049643520"
        },
        {
            "node_id": "547363491909672960",
            "debug": false,
            "name": "消息回复",
            "description": "",
            "node_type": 3,
            "node_version": "v0",
            "meta": {
                "position": {
                    "x": 1280,
                    "y": 379
                }
            },
            "params": {
                "type": "text",
                "content": {
                    "id": "component-663c6d64b33d4",
                    "version": "1",
                    "type": "value",
                    "structure": {
                        "type": "expression",
                        "const_value": null,
                        "expression_value": [
                            {
                                "type": "fields",
                                "value": "547363472049643520.response",
                                "name": "",
                                "args": null
                            }
                        ]
                    }
                },
                "link": {
                    "id": "component-663c6d64b33ed",
                    "version": "1",
                    "type": "value",
                    "structure": {
                        "type": "expression",
                        "const_value": null,
                        "expression_value": null
                    }
                },
                "link_desc": {
                    "id": "component-663c6d64b33f4",
                    "version": "1",
                    "type": "value",
                    "structure": {
                        "type": "expression",
                        "const_value": null,
                        "expression_value": null
                    }
                },
                "recipients": null
            },
            "next_nodes": [

            ],
            "input": null,
            "output": null,
            "system_output": null,
            "id": "547363491909672960"
        }
    ],
    "global_variable": null,
    "enabled": true,
    "version_code": "",
    "creator": "usi_a450dd07688be6273b5ef112ad50ba7e",
    "created_at": "2025-02-06 18:27:22",
    "modifier": "usi_a450dd07688be6273b5ef112ad50ba7e",
    "updated_at": "2025-02-06 18:27:22"
}
JSON
            ,
            true
        ));

        $operator = $this->getOperator();
        $triggerData = new TriggerData(
            triggerTime: new DateTime(),
            userInfo: ['user_entity' => TriggerData::createUserEntity($operator->getUid(), $operator->getNickname(), $operator->getOrganizationCode())],
            messageInfo: ['message_entity' => TriggerData::createMessageEntity(new TextMessage(['content' => '你好']))],
            params: [],
        );

        $executionData = $this->createExecutionData(triggerType: TriggerType::ChatMessage, triggerData: $triggerData, executionType: ExecutionType::IMChat);
        $executor = new MagicFlowExecutor($magicFlowEntity, $executionData);
        $executor->execute();
        $this->assertTrue($executor->isSuccess());
        sleep(10);
    }

    private function getMagicFlowEntity(): MagicFlowEntity
    {
        $magicFlowEntity = new MagicFlowEntity();
        $magicFlowEntity->setCode('unit_test.' . uniqid());
        $magicFlowEntity->setName('unit_test');
        $magicFlowEntity->setType(Type::Main);
        $magicFlowEntity->setCreator('system_unit');
        return $magicFlowEntity;
    }
}
