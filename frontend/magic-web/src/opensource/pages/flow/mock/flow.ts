export default {
    "id": "MAGIC-FLOW-671785439a1a90-43857711",
    "name": "31231321",
    "description": "323131",
    "icon": "test",
    "type": 1,
    "tool_set_id": "not_grouped",
    "edges": [
        {
            "id": "508917063992672257",
            "source": "508917049740427264",
            "target": "508917063992672256",
            "sourceHandle": "branch_66f4fec213221",
            "type": "commonEdge",
            "markerEnd": {
                "type": "arrow",
                "width": 20,
                "height": 20,
                "color": "#4d53e8"
            },
            "style": {
                "stroke": "#4d53e8",
                "strokeWidth": 2
            },
            "data": {
                "allowAddOnLine": true
            }
        },
        {
            "id": "508917206225715200",
            "source": "508917063992672256",
            "target": "508917206221520896",
            "type": "commonEdge",
            "markerEnd": {
                "type": "arrow",
                "width": 20,
                "height": 20,
                "color": "#4d53e8"
            },
            "style": {
                "stroke": "#4d53e8",
                "strokeWidth": 2
            },
            "data": {
                "allowAddOnLine": true
            }
        },
        {
            "id": "508917272491524097",
            "source": "508917206221520896",
            "target": "508917272491524096",
            "type": "commonEdge",
            "markerEnd": {
                "type": "arrow",
                "width": 20,
                "height": 20,
                "color": "#4d53e8"
            },
            "style": {
                "stroke": "#4d53e8",
                "strokeWidth": 2
            },
            "data": {
                "allowAddOnLine": true
            }
        },
        {
            "id": "508917353550643201",
            "source": "508917272491524096",
            "target": "508917353550643200",
            "type": "commonEdge",
            "markerEnd": {
                "type": "arrow",
                "width": 20,
                "height": 20,
                "color": "#4d53e8"
            },
            "style": {
                "stroke": "#4d53e8",
                "strokeWidth": 2
            },
            "data": {
                "allowAddOnLine": true
            }
        }
    ],
    "nodes": [
        {
            "id": "508917049740427264",
            "node_id": "508917049740427264",
            "remark": "当以下事件被触发时，流程将会从这个模块开始执行",
            "node_type": "1",
            "next_nodes": [
                "508917063992672256"
            ],
            "meta": {
                "position": {
                    "x": 0,
                    "y": 25
                }
            },
            "params": {
                "branches": [
                    {
                        "branch_id": "branch_66f4fec213195",
                        "trigger_type": 1,
                        "next_nodes": [],
                        "config": null,
                        "input": {
                            "widget": null,
                            "form": {
                                "id": "component-66f4fec2131ad",
                                "version": "1",
                                "type": "form",
                                "structure": {
                                    "type": "object",
                                    "key": "root",
                                    "sort": 0,
                                    "title": "root节点",
                                    "description": "",
                                    "required": [
                                        "user_id",
                                        "nickname",
                                        "chat_time",
                                        "message_type",
                                        "content"
                                    ],
                                    "value": null,
                                    "items": null,
                                    "properties": {
                                        "user_id": {
                                            "type": "string",
                                            "key": "user_id",
                                            "sort": 0,
                                            "title": " 用户ID",
                                            "description": "",
                                            "required": null,
                                            "value": null,
                                            "items": null,
                                            "properties": null
                                        },
                                        "nickname": {
                                            "type": "string",
                                            "key": "nickname",
                                            "sort": 1,
                                            "title": " 用户昵称",
                                            "description": "",
                                            "required": null,
                                            "value": null,
                                            "items": null,
                                            "properties": null
                                        },
                                        "chat_time": {
                                            "type": "string",
                                            "key": "chat_time",
                                            "sort": 2,
                                            "title": "发送时间",
                                            "description": "",
                                            "required": null,
                                            "value": null,
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
                                            "items": null,
                                            "properties": null
                                        },
                                        "content": {
                                            "type": "string",
                                            "key": "content",
                                            "sort": 4,
                                            "title": "消息内容",
                                            "description": "",
                                            "required": null,
                                            "value": null,
                                            "items": null,
                                            "properties": null
                                        }
                                    }
                                }
                            }
                        },
                        "output": {
                            "widget": null,
                            "form": {
                                "id": "component-66f4fec2131ad",
                                "version": "1",
                                "type": "form",
                                "structure": {
                                    "type": "object",
                                    "key": "root",
                                    "sort": 0,
                                    "title": "root节点",
                                    "description": "",
                                    "required": [
                                        "user_id",
                                        "nickname",
                                        "chat_time",
                                        "message_type",
                                        "content"
                                    ],
                                    "value": null,
                                    "items": null,
                                    "properties": {
                                        "user_id": {
                                            "type": "string",
                                            "key": "user_id",
                                            "sort": 0,
                                            "title": " 用户ID",
                                            "description": "",
                                            "required": null,
                                            "value": null,
                                            "items": null,
                                            "properties": null
                                        },
                                        "nickname": {
                                            "type": "string",
                                            "key": "nickname",
                                            "sort": 1,
                                            "title": " 用户昵称",
                                            "description": "",
                                            "required": null,
                                            "value": null,
                                            "items": null,
                                            "properties": null
                                        },
                                        "chat_time": {
                                            "type": "string",
                                            "key": "chat_time",
                                            "sort": 2,
                                            "title": "发送时间",
                                            "description": "",
                                            "required": null,
                                            "value": null,
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
                                            "items": null,
                                            "properties": null
                                        },
                                        "content": {
                                            "type": "string",
                                            "key": "content",
                                            "sort": 4,
                                            "title": "消息内容",
                                            "description": "",
                                            "required": null,
                                            "value": null,
                                            "items": null,
                                            "properties": null
                                        }
                                    }
                                }
                            }
                        }
                    },
                    {
                        "branch_id": "branch_66f4fec213221",
                        "trigger_type": 2,
                        "next_nodes": [
                            "508917063992672256"
                        ],
                        "config": {
                            "interval": 10,
                            "unit": "minutes"
                        },
                        "input": {
                            "widget": null,
                            "form": {
                                "id": "component-66f4fec21322b",
                                "version": "1",
                                "type": "form",
                                "structure": {
                                    "type": "object",
                                    "key": "root",
                                    "sort": 0,
                                    "title": "root节点",
                                    "description": "",
                                    "required": [
                                        "user_id",
                                        "nickname",
                                        "open_time"
                                    ],
                                    "value": null,
                                    "items": null,
                                    "properties": {
                                        "user_id": {
                                            "type": "string",
                                            "key": "user_id",
                                            "sort": 0,
                                            "title": " 用户ID",
                                            "description": "",
                                            "required": null,
                                            "value": null,
                                            "items": null,
                                            "properties": null
                                        },
                                        "nickname": {
                                            "type": "string",
                                            "key": "nickname",
                                            "sort": 1,
                                            "title": " 用户昵称",
                                            "description": "",
                                            "required": null,
                                            "value": null,
                                            "items": null,
                                            "properties": null
                                        },
                                        "open_time": {
                                            "type": "string",
                                            "key": "open_time",
                                            "sort": 2,
                                            "title": "打开时间",
                                            "description": "",
                                            "required": null,
                                            "value": null,
                                            "items": null,
                                            "properties": null
                                        }
                                    }
                                }
                            }
                        },
                        "output": {
                            "widget": null,
                            "form": {
                                "id": "component-66f4fec21322b",
                                "version": "1",
                                "type": "form",
                                "structure": {
                                    "type": "object",
                                    "key": "root",
                                    "sort": 0,
                                    "title": "root节点",
                                    "description": "",
                                    "required": [
                                        "user_id",
                                        "nickname",
                                        "open_time"
                                    ],
                                    "value": null,
                                    "items": null,
                                    "properties": {
                                        "user_id": {
                                            "type": "string",
                                            "key": "user_id",
                                            "sort": 0,
                                            "title": " 用户ID",
                                            "description": "",
                                            "required": null,
                                            "value": null,
                                            "items": null,
                                            "properties": null
                                        },
                                        "nickname": {
                                            "type": "string",
                                            "key": "nickname",
                                            "sort": 1,
                                            "title": " 用户昵称",
                                            "description": "",
                                            "required": null,
                                            "value": null,
                                            "items": null,
                                            "properties": null
                                        },
                                        "open_time": {
                                            "type": "string",
                                            "key": "open_time",
                                            "sort": 2,
                                            "title": "打开时间",
                                            "description": "",
                                            "required": null,
                                            "value": null,
                                            "items": null,
                                            "properties": null
                                        }
                                    }
                                }
                            }
                        }
                    },
                    {
                        "branch_id": "branch_66f4fec213261",
                        "trigger_type": 4,
                        "next_nodes": [],
                        "config": null,
                        "input": {
                            "widget": {
                                "id": "component-66f4fec2136a5",
                                "version": "1",
                                "type": "widget",
                                "structure": {
                                    "type": "object",
                                    "key": "root",
                                    "sort": 0,
                                    "title": "",
                                    "description": "",
                                    "initial_value": null,
                                    "value": null,
                                    "display_config": null,
                                    "items": null,
                                    "properties": null
                                }
                            },
                            "form": {
                                "id": "component-66f4fec213264",
                                "version": "1",
                                "type": "form",
                                "structure": {
                                    "type": "object",
                                    "key": "root",
                                    "sort": 0,
                                    "title": null,
                                    "description": null,
                                    "required": [],
                                    "value": null,
                                    "items": null,
                                    "properties": null
                                }
                            }
                        },
                        "output": {
                            "widget": {
                                "id": "component-66f4fec2136a5",
                                "version": "1",
                                "type": "widget",
                                "structure": {
                                    "type": "object",
                                    "key": "root",
                                    "sort": 0,
                                    "title": "",
                                    "description": "",
                                    "initial_value": null,
                                    "value": null,
                                    "display_config": null,
                                    "items": null,
                                    "properties": null
                                }
                            },
                            "form": {
                                "id": "component-66f4fec213264",
                                "version": "1",
                                "type": "form",
                                "structure": {
                                    "type": "object",
                                    "key": "root",
                                    "sort": 0,
                                    "title": null,
                                    "description": null,
                                    "required": [],
                                    "value": null,
                                    "items": null,
                                    "properties": null
                                }
                            }
                        }
                    }
                ]
            },
            "output": null,
            "name": "开始节点"
        },
        {
            "params": {
                "file_id": "655044713557733376",
                "sheet_id": "655044713557733376",
                "columns": {
                    "7FQgdZNs": {
                        "type": "const",
                        "const_value": [
                            {
                                "type": "input",
                                "uniqueId": "641188670509944832",
                                "value": ""
                            },
                            {
                                "type": "fields",
                                "uniqueId": "641188678961467392",
                                "value": "508917049740427264.user_id"
                            }
                        ],
                        "expression_value": []
                    },
                    "Fq8G8aQT": {
                        "type": "const",
                        "const_value": [
                            {
                                "type": "datetime",
                                "uniqueId": "641188693373095936",
                                "datetime_value": {
                                    "type": "today",
                                    "value": ""
                                },
                                "value": ""
                            }
                        ],
                        "expression_value": []
                    },
                    "DeoJiU8P": {
                        "type": "const",
                        "const_value": [
                            {
                                "type": "fields",
                                "uniqueId": "641188746170994688",
                                "value": "508917049740427264.user_id",
                                "trans": "toNumber()"
                            }
                        ],
                        "expression_value": []
                    },
                    "SUfAG93B": {
                        "type": "const",
                        "const_value": [
                            {
                                "type": "input",
                                "uniqueId": "641188755125833728",
                                "value": ""
                            },
                            {
                                "type": "multiple",
                                "uniqueId": "641188762818187264",
                                "multiple_value": [
                                    "CMkoeB1712546568666"
                                ],
                                "value": ""
                            }
                        ],
                        "expression_value": []
                    }
                }
            },
            "id": "508917063992672256",
            "node_id": "508917063992672256",
            "remark": "",
            "node_type": "40",
            "next_nodes": [
                "508917206221520896"
            ],
            "meta": {
                "position": {
                    "x": 580,
                    "y": 0
                }
            },
            "output": null,
            "name": "新增记录"
        },
        {
            "params": {
                "file_id": "655044713557733376",
                "sheet_id": "655044713557733376",
                "filters": [
                    {
                        "column_id": "7FQgdZNs",
                        "column_type": "TEXT",
                        "operator": "=",
                        "value": {
                            "type": "const",
                            "const_value": [
                                {
                                    "type": "input",
                                    "uniqueId": "641188801451921408",
                                    "value": ""
                                },
                                {
                                    "type": "fields",
                                    "uniqueId": "641188811375644672",
                                    "value": "508917049740427264.user_id"
                                }
                            ],
                            "expression_value": []
                        }
                    }
                ],
                "select_record_type": "1",
                "filter_type": "0",
                "columns": {
                    "Fq8G8aQT": {
                        "type": "const",
                        "const_value": [
                            {
                                "type": "datetime",
                                "uniqueId": "641188828672954368",
                                "datetime_value": {
                                    "type": "yesterday",
                                    "value": ""
                                },
                                "value": ""
                            }
                        ],
                        "expression_value": []
                    }
                }
            },
            "id": "508917206221520896",
            "node_id": "508917206221520896",
            "remark": "",
            "node_type": "41",
            "next_nodes": [
                "508917272491524096"
            ],
            "meta": {
                "position": {
                    "x": 1280,
                    "y": 42.5
                }
            },
            "output": null,
            "name": "修改记录"
        },
        {
            "params": {
                "file_id": "655044713557733376",
                "sheet_id": "655044713557733376",
                "filters": [
                    {
                        "operator": "<",
                        "column_type": "DATETIME",
                        "value": {
                            "type": "const",
                            "const_value": [
                                {
                                    "type": "input",
                                    "uniqueId": "641188899686715392",
                                    "value": ""
                                },
                                {
                                    "type": "datetime",
                                    "uniqueId": "641188907802693632",
                                    "datetime_value": {
                                        "type": "yesterday",
                                        "value": ""
                                    },
                                    "value": ""
                                }
                            ],
                            "expression_value": []
                        },
                        "column_id": "Fq8G8aQT"
                    }
                ],
                "select_record_type": "1",
                "filter_type": "0",
                "columns": {}
            },
            "id": "508917272491524096",
            "node_id": "508917272491524096",
            "remark": "",
            "node_type": "42",
            "next_nodes": [
                "508917353550643200"
            ],
            "meta": {
                "position": {
                    "x": 2020,
                    "y": 107
                }
            },
            "output": null,
            "name": "查询记录"
        },
        {
            "params": {
                "file_id": "655044713557733376",
                "sheet_id": "655044713557733376",
                "filters": [
                    {
                        "operator": "=",
                        "column_type": "MULTIPLE",
                        "value": {
                            "type": "const",
                            "const_value": [
                                {
                                    "type": "multiple",
                                    "uniqueId": "641188983040118784",
                                    "multiple_value": [
                                        "CMkoeB1712546568666"
                                    ],
                                    "value": ""
                                },
                                {
                                    "type": "input",
                                    "uniqueId": "641188983254028288",
                                    "value": ""
                                },
                                {
                                    "type": "multiple",
                                    "uniqueId": "641188993504907264",
                                    "multiple_value": [
                                        "cVUC7T1712546593465"
                                    ],
                                    "value": ""
                                }
                            ],
                            "expression_value": []
                        },
                        "column_id": "SUfAG93B"
                    }
                ],
                "select_record_type": "1",
                "filter_type": "0",
                "columns": {}
            },
            "id": "508917353550643200",
            "node_id": "508917353550643200",
            "remark": "",
            "node_type": "43",
            "next_nodes": [],
            "meta": {
                "position": {
                    "x": 2760,
                    "y": 129
                }
            },
            "output": null,
            "name": "删除记录"
        }
    ],
    "enabled": false,
    "version_code": "",
    "creator": "usi_f7214f19a71e0b443ab3aa2b1c5b1c10",
    "created_at": "2024-10-22 18:58:11",
    "modifier": "usi_f7214f19a71e0b443ab3aa2b1c5b1c10",
    "updated_at": "2024-10-22 18:58:11",
    "creator_info": null,
    "modifier_info": null
}