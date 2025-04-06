export default {
    "id": "MAGIC-FLOW-677663f1ca9088-26607117",
    "icon": "",
    "name": "测试等待节点",
    "type": 1,
    "edges": [
        {
            "id": "563974308222533632",
            "source": "561486254673670144",
            "target": "563974308155424768",
            "sourceHandle": "branch_676d8894813d9",
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
            "id": "563974393920552960",
            "source": "563974308155424768",
            "target": "563974393446596608",
            "sourceHandle": "branch_66c444c8ca355",
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
            "id": "563974408558673920",
            "source": "563974308155424768",
            "target": "563974408038580224",
            "sourceHandle": "E4FmQ42r",
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
            "id": "561486254673670144",
            "meta": {
                "position": {
                    "x": 0,
                    "y": 0
                }
            },
            "name": "开始节点",
            "input": null,
            "output": null,
            "params": {
                "branches": [
                    {
                        "input": null,
                        "config": null,
                        "output": {
                            "form": {
                                "id": "component-676d88948147b",
                                "type": "form",
                                "version": "1",
                                "structure": {
                                    "key": "root",
                                    "sort": 0,
                                    "type": "object",
                                    "items": null,
                                    "title": "root节点",
                                    "value": null,
                                    "required": [
                                        "conversation_id",
                                        "topic_id",
                                        "message_content",
                                        "message_type",
                                        "message_time",
                                        "organization_code",
                                        "user"
                                    ],
                                    "encryption": false,
                                    "properties": {
                                        "user": {
                                            "key": "user",
                                            "sort": 7,
                                            "type": "object",
                                            "items": null,
                                            "title": "用户",
                                            "value": null,
                                            "required": [
                                                "id",
                                                "nickname",
                                                "real_name"
                                            ],
                                            "encryption": false,
                                            "properties": {
                                                "id": {
                                                    "key": "id",
                                                    "sort": 0,
                                                    "type": "string",
                                                    "items": null,
                                                    "title": "用户 ID",
                                                    "value": null,
                                                    "required": null,
                                                    "encryption": false,
                                                    "properties": null,
                                                    "description": "",
                                                    "encryption_value": null
                                                },
                                                "nickname": {
                                                    "key": "nickname",
                                                    "sort": 1,
                                                    "type": "string",
                                                    "items": null,
                                                    "title": "用户昵称",
                                                    "value": null,
                                                    "required": null,
                                                    "encryption": false,
                                                    "properties": null,
                                                    "description": "",
                                                    "encryption_value": null
                                                },
                                                "real_name": {
                                                    "key": "real_name",
                                                    "sort": 2,
                                                    "type": "string",
                                                    "items": null,
                                                    "title": "真实姓名",
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
                                        "files": {
                                            "key": "files",
                                            "sort": 6,
                                            "type": "array",
                                            "items": {
                                                "key": "files",
                                                "sort": 0,
                                                "type": "object",
                                                "items": null,
                                                "title": "文件",
                                                "value": null,
                                                "required": [
                                                    "name",
                                                    "url",
                                                    "extension",
                                                    "size"
                                                ],
                                                "encryption": false,
                                                "properties": {
                                                    "url": {
                                                        "key": "url",
                                                        "sort": 1,
                                                        "type": "string",
                                                        "items": null,
                                                        "title": "文件链接",
                                                        "value": null,
                                                        "required": null,
                                                        "encryption": false,
                                                        "properties": null,
                                                        "description": "",
                                                        "encryption_value": null
                                                    },
                                                    "name": {
                                                        "key": "name",
                                                        "sort": 0,
                                                        "type": "string",
                                                        "items": null,
                                                        "title": "文件名称",
                                                        "value": null,
                                                        "required": null,
                                                        "encryption": false,
                                                        "properties": null,
                                                        "description": "",
                                                        "encryption_value": null
                                                    },
                                                    "size": {
                                                        "key": "size",
                                                        "sort": 3,
                                                        "type": "number",
                                                        "items": null,
                                                        "title": "文件大小",
                                                        "value": null,
                                                        "required": null,
                                                        "encryption": false,
                                                        "properties": null,
                                                        "description": "",
                                                        "encryption_value": null
                                                    },
                                                    "extension": {
                                                        "key": "extension",
                                                        "sort": 2,
                                                        "type": "string",
                                                        "items": null,
                                                        "title": "文件扩展名",
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
                                            "title": "文件列表",
                                            "value": null,
                                            "required": null,
                                            "encryption": false,
                                            "properties": null,
                                            "description": "",
                                            "encryption_value": null
                                        },
                                        "topic_id": {
                                            "key": "topic_id",
                                            "sort": 1,
                                            "type": "string",
                                            "items": null,
                                            "title": "话题 ID",
                                            "value": null,
                                            "required": null,
                                            "encryption": false,
                                            "properties": null,
                                            "description": "",
                                            "encryption_value": null
                                        },
                                        "message_time": {
                                            "key": "message_time",
                                            "sort": 4,
                                            "type": "string",
                                            "items": null,
                                            "title": "发送时间",
                                            "value": null,
                                            "required": null,
                                            "encryption": false,
                                            "properties": null,
                                            "description": "",
                                            "encryption_value": null
                                        },
                                        "message_type": {
                                            "key": "message_type",
                                            "sort": 3,
                                            "type": "string",
                                            "items": null,
                                            "title": "消息类型",
                                            "value": null,
                                            "required": null,
                                            "encryption": false,
                                            "properties": null,
                                            "description": "",
                                            "encryption_value": null
                                        },
                                        "conversation_id": {
                                            "key": "conversation_id",
                                            "sort": 0,
                                            "type": "string",
                                            "items": null,
                                            "title": "会话 ID",
                                            "value": null,
                                            "required": null,
                                            "encryption": false,
                                            "properties": null,
                                            "description": "",
                                            "encryption_value": null
                                        },
                                        "message_content": {
                                            "key": "message_content",
                                            "sort": 2,
                                            "type": "string",
                                            "items": null,
                                            "title": "消息内容",
                                            "value": null,
                                            "required": null,
                                            "encryption": false,
                                            "properties": null,
                                            "description": "",
                                            "encryption_value": null
                                        },
                                        "organization_code": {
                                            "key": "organization_code",
                                            "sort": 5,
                                            "type": "string",
                                            "items": null,
                                            "title": "组织编码",
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
                            },
                            "widget": null
                        },
                        "branch_id": "branch_676d8894813d9",
                        "next_nodes": [
                            "536129435221430272",
                            "563974308155424768"
                        ],
                        "trigger_type": 1,
                        "system_output": null,
                        "custom_system_output": null
                    },
                    {
                        "input": null,
                        "config": {
                            "unit": "minutes",
                            "interval": 10
                        },
                        "output": {
                            "form": {
                                "id": "component-676d8894815b9",
                                "type": "form",
                                "version": "1",
                                "structure": {
                                    "key": "root",
                                    "sort": 0,
                                    "type": "object",
                                    "items": null,
                                    "title": "root节点",
                                    "value": null,
                                    "required": [
                                        "conversation_id",
                                        "topic_id",
                                        "organization_code",
                                        "user",
                                        "open_time"
                                    ],
                                    "encryption": false,
                                    "properties": {
                                        "user": {
                                            "key": "user",
                                            "sort": 3,
                                            "type": "object",
                                            "items": null,
                                            "title": "用户",
                                            "value": null,
                                            "required": [
                                                "id",
                                                "nickname",
                                                "real_name"
                                            ],
                                            "encryption": false,
                                            "properties": {
                                                "id": {
                                                    "key": "id",
                                                    "sort": 0,
                                                    "type": "string",
                                                    "items": null,
                                                    "title": "用户 ID",
                                                    "value": null,
                                                    "required": null,
                                                    "encryption": false,
                                                    "properties": null,
                                                    "description": "",
                                                    "encryption_value": null
                                                },
                                                "nickname": {
                                                    "key": "nickname",
                                                    "sort": 1,
                                                    "type": "string",
                                                    "items": null,
                                                    "title": "用户昵称",
                                                    "value": null,
                                                    "required": null,
                                                    "encryption": false,
                                                    "properties": null,
                                                    "description": "",
                                                    "encryption_value": null
                                                },
                                                "real_name": {
                                                    "key": "real_name",
                                                    "sort": 2,
                                                    "type": "string",
                                                    "items": null,
                                                    "title": "真实姓名",
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
                                        "topic_id": {
                                            "key": "topic_id",
                                            "sort": 1,
                                            "type": "string",
                                            "items": null,
                                            "title": "话题 ID",
                                            "value": null,
                                            "required": null,
                                            "encryption": false,
                                            "properties": null,
                                            "description": "",
                                            "encryption_value": null
                                        },
                                        "open_time": {
                                            "key": "open_time",
                                            "sort": 4,
                                            "type": "string",
                                            "items": null,
                                            "title": "打开时间",
                                            "value": null,
                                            "required": null,
                                            "encryption": false,
                                            "properties": null,
                                            "description": "",
                                            "encryption_value": null
                                        },
                                        "conversation_id": {
                                            "key": "conversation_id",
                                            "sort": 0,
                                            "type": "string",
                                            "items": null,
                                            "title": "会话 ID",
                                            "value": null,
                                            "required": null,
                                            "encryption": false,
                                            "properties": null,
                                            "description": "",
                                            "encryption_value": null
                                        },
                                        "organization_code": {
                                            "key": "organization_code",
                                            "sort": 2,
                                            "type": "string",
                                            "items": null,
                                            "title": "组织编码",
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
                            },
                            "widget": null
                        },
                        "branch_id": "branch_676d8894815a6",
                        "next_nodes": [],
                        "trigger_type": 2,
                        "system_output": null,
                        "custom_system_output": null
                    },
                    {
                        "input": null,
                        "config": null,
                        "output": {
                            "form": {
                                "id": "component-676d889481642",
                                "type": "form",
                                "version": "1",
                                "structure": {
                                    "key": "root",
                                    "sort": 0,
                                    "type": "object",
                                    "items": null,
                                    "title": null,
                                    "value": null,
                                    "required": [],
                                    "encryption": false,
                                    "properties": null,
                                    "description": null,
                                    "encryption_value": null
                                }
                            },
                            "widget": null
                        },
                        "branch_id": "branch_676d889481641",
                        "next_nodes": [],
                        "trigger_type": 4,
                        "system_output": {
                            "form": {
                                "id": "component-676d889481675",
                                "type": "form",
                                "version": "1",
                                "structure": {
                                    "key": "root",
                                    "sort": 0,
                                    "type": "object",
                                    "items": null,
                                    "title": "root节点",
                                    "value": null,
                                    "required": [
                                        "conversation_id",
                                        "topic_id",
                                        "message_content",
                                        "message_type",
                                        "message_time",
                                        "organization_code",
                                        "user"
                                    ],
                                    "encryption": false,
                                    "properties": {
                                        "user": {
                                            "key": "user",
                                            "sort": 7,
                                            "type": "object",
                                            "items": null,
                                            "title": "用户",
                                            "value": null,
                                            "required": [
                                                "id",
                                                "nickname",
                                                "real_name"
                                            ],
                                            "encryption": false,
                                            "properties": {
                                                "id": {
                                                    "key": "id",
                                                    "sort": 0,
                                                    "type": "string",
                                                    "items": null,
                                                    "title": "用户 ID",
                                                    "value": null,
                                                    "required": null,
                                                    "encryption": false,
                                                    "properties": null,
                                                    "description": "",
                                                    "encryption_value": null
                                                },
                                                "nickname": {
                                                    "key": "nickname",
                                                    "sort": 1,
                                                    "type": "string",
                                                    "items": null,
                                                    "title": "用户昵称",
                                                    "value": null,
                                                    "required": null,
                                                    "encryption": false,
                                                    "properties": null,
                                                    "description": "",
                                                    "encryption_value": null
                                                },
                                                "real_name": {
                                                    "key": "real_name",
                                                    "sort": 2,
                                                    "type": "string",
                                                    "items": null,
                                                    "title": "真实姓名",
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
                                        "files": {
                                            "key": "files",
                                            "sort": 6,
                                            "type": "array",
                                            "items": {
                                                "key": "files",
                                                "sort": 0,
                                                "type": "object",
                                                "items": null,
                                                "title": "文件",
                                                "value": null,
                                                "required": [
                                                    "name",
                                                    "url",
                                                    "extension",
                                                    "size"
                                                ],
                                                "encryption": false,
                                                "properties": {
                                                    "url": {
                                                        "key": "url",
                                                        "sort": 1,
                                                        "type": "string",
                                                        "items": null,
                                                        "title": "文件链接",
                                                        "value": null,
                                                        "required": null,
                                                        "encryption": false,
                                                        "properties": null,
                                                        "description": "",
                                                        "encryption_value": null
                                                    },
                                                    "name": {
                                                        "key": "name",
                                                        "sort": 0,
                                                        "type": "string",
                                                        "items": null,
                                                        "title": "文件名称",
                                                        "value": null,
                                                        "required": null,
                                                        "encryption": false,
                                                        "properties": null,
                                                        "description": "",
                                                        "encryption_value": null
                                                    },
                                                    "size": {
                                                        "key": "size",
                                                        "sort": 3,
                                                        "type": "number",
                                                        "items": null,
                                                        "title": "文件大小",
                                                        "value": null,
                                                        "required": null,
                                                        "encryption": false,
                                                        "properties": null,
                                                        "description": "",
                                                        "encryption_value": null
                                                    },
                                                    "extension": {
                                                        "key": "extension",
                                                        "sort": 2,
                                                        "type": "string",
                                                        "items": null,
                                                        "title": "文件扩展名",
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
                                            "title": "文件列表",
                                            "value": null,
                                            "required": null,
                                            "encryption": false,
                                            "properties": null,
                                            "description": "",
                                            "encryption_value": null
                                        },
                                        "topic_id": {
                                            "key": "topic_id",
                                            "sort": 1,
                                            "type": "string",
                                            "items": null,
                                            "title": "话题 ID",
                                            "value": null,
                                            "required": null,
                                            "encryption": false,
                                            "properties": null,
                                            "description": "",
                                            "encryption_value": null
                                        },
                                        "message_time": {
                                            "key": "message_time",
                                            "sort": 4,
                                            "type": "string",
                                            "items": null,
                                            "title": "发送时间",
                                            "value": null,
                                            "required": null,
                                            "encryption": false,
                                            "properties": null,
                                            "description": "",
                                            "encryption_value": null
                                        },
                                        "message_type": {
                                            "key": "message_type",
                                            "sort": 3,
                                            "type": "string",
                                            "items": null,
                                            "title": "消息类型",
                                            "value": null,
                                            "required": null,
                                            "encryption": false,
                                            "properties": null,
                                            "description": "",
                                            "encryption_value": null
                                        },
                                        "conversation_id": {
                                            "key": "conversation_id",
                                            "sort": 0,
                                            "type": "string",
                                            "items": null,
                                            "title": "会话 ID",
                                            "value": null,
                                            "required": null,
                                            "encryption": false,
                                            "properties": null,
                                            "description": "",
                                            "encryption_value": null
                                        },
                                        "message_content": {
                                            "key": "message_content",
                                            "sort": 2,
                                            "type": "string",
                                            "items": null,
                                            "title": "消息内容",
                                            "value": null,
                                            "required": null,
                                            "encryption": false,
                                            "properties": null,
                                            "description": "",
                                            "encryption_value": null
                                        },
                                        "organization_code": {
                                            "key": "organization_code",
                                            "sort": 5,
                                            "type": "string",
                                            "items": null,
                                            "title": "组织编码",
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
                            },
                            "widget": null
                        },
                        "custom_system_output": {
                            "form": {
                                "id": "component-676d88948175a",
                                "type": "form",
                                "version": "1",
                                "structure": {
                                    "key": "root",
                                    "sort": 0,
                                    "type": "object",
                                    "items": null,
                                    "title": null,
                                    "value": null,
                                    "required": [],
                                    "encryption": false,
                                    "properties": null,
                                    "description": null,
                                    "encryption_value": null
                                }
                            },
                            "widget": null
                        }
                    },
                    {
                        "input": null,
                        "config": null,
                        "output": null,
                        "branch_id": "branch_676d88948176d",
                        "next_nodes": [],
                        "trigger_type": 5,
                        "system_output": null,
                        "custom_system_output": null
                    },
                    {
                        "input": null,
                        "config": null,
                        "output": {
                            "form": {
                                "id": "component-676d88948177b",
                                "type": "form",
                                "version": "1",
                                "structure": {
                                    "key": "root",
                                    "sort": 0,
                                    "type": "object",
                                    "items": null,
                                    "title": "root节点",
                                    "value": null,
                                    "required": [
                                        "add_time",
                                        "user"
                                    ],
                                    "encryption": false,
                                    "properties": {
                                        "user": {
                                            "key": "user",
                                            "sort": 0,
                                            "type": "object",
                                            "items": null,
                                            "title": "用户",
                                            "value": null,
                                            "required": [
                                                "id",
                                                "nickname",
                                                "real_name"
                                            ],
                                            "encryption": false,
                                            "properties": {
                                                "id": {
                                                    "key": "id",
                                                    "sort": 0,
                                                    "type": "string",
                                                    "items": null,
                                                    "title": "用户 ID",
                                                    "value": null,
                                                    "required": null,
                                                    "encryption": false,
                                                    "properties": null,
                                                    "description": "",
                                                    "encryption_value": null
                                                },
                                                "nickname": {
                                                    "key": "nickname",
                                                    "sort": 1,
                                                    "type": "string",
                                                    "items": null,
                                                    "title": "用户昵称",
                                                    "value": null,
                                                    "required": null,
                                                    "encryption": false,
                                                    "properties": null,
                                                    "description": "",
                                                    "encryption_value": null
                                                },
                                                "real_name": {
                                                    "key": "real_name",
                                                    "sort": 2,
                                                    "type": "string",
                                                    "items": null,
                                                    "title": "真实姓名",
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
                                        "add_time": {
                                            "key": "add_time",
                                            "sort": 1,
                                            "type": "string",
                                            "items": null,
                                            "title": "添加时间",
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
                            },
                            "widget": null
                        },
                        "branch_id": "branch_676d88948176e",
                        "next_nodes": [],
                        "trigger_type": 7,
                        "system_output": null,
                        "custom_system_output": null
                    }
                ]
            },
            "remark": "当以下事件被触发时，流程将会从这个模块开始执行",
            "node_id": "561486254673670144",
            "node_type": "1",
            "next_nodes": [
                "536129435221430272",
                "563974308155424768"
            ],
            "node_version": "v0",
            "debug": true
        },
        {
            "params": {
                "max_execute_num": 1,
                "branches": [
                    {
                        "branch_id": "branch_66c444c8ca355",
                        "branch_type": "if",
                        "next_nodes": [
                            "563974393446596608"
                        ],
                        "parameters": {
                            "id": "component-66c444c8ca73e",
                            "version": "1",
                            "type": "condition",
                            "structure": null
                        }
                    },
                    {
                        "branch_id": "E4FmQ42r",
                        "next_nodes": [
                            "563974408038580224"
                        ],
                        "branch_type": "if",
                        "parameters": {
                            "id": "9aRTD5MU",
                            "version": "1",
                            "type": "condition",
                            "structure": {
                                "ops": "AND",
                                "children": []
                            }
                        }
                    },
                    {
                        "branch_id": "branch_66c444c8ca7d5",
                        "branch_type": "else",
                        "next_nodes": [],
                        "parameters": {}
                    }
                ]
            },
            "id": "563974308155424768",
            "node_id": "563974308155424768",
            "remark": "",
            "node_type": "4",
            "next_nodes": [
                "563974393446596608",
                "563974408038580224"
            ],
            "meta": {
                "position": {
                    "x": 580,
                    "y": 162
                }
            },
            "output": null,
            "input": null,
            "node_version": "v0",
            "name": "选择器"
        },
        {
            "params": {
                "tool_id": "",
                "mode": "llm",
                "custom_system_input": {
                    "widget": null,
                    "form": {
                        "id": "component-674c4f70bc3a8",
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
                            "encryption": false,
                            "encryption_value": null,
                            "items": null,
                            "properties": null
                        }
                    }
                },
                "async": false,
                "model": "gpt-4o-global",
                "model_config": {
                    "auto_memory": false,
                    "max_record": 50,
                    "temperature": 0.5
                },
                "user_prompt": {
                    "id": "component-674c4f70bc485",
                    "version": "1",
                    "type": "value",
                    "structure": {
                        "type": "expression",
                        "const_value": null,
                        "expression_value": null
                    }
                }
            },
            "id": "563974393446596608",
            "node_id": "563974393446596608",
            "remark": "",
            "node_type": "15",
            "next_nodes": [],
            "meta": {
                "position": {
                    "x": 1580,
                    "y": 76
                }
            },
            "output": null,
            "input": {
                "widget": null,
                "form": null
            },
            "node_version": "v0",
            "name": "工具"
        },
        {
            "params": {
                "tool_id": "",
                "mode": "llm",
                "custom_system_input": {
                    "widget": null,
                    "form": {
                        "id": "component-674c4f70bc3a8",
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
                            "encryption": false,
                            "encryption_value": null,
                            "items": null,
                            "properties": null
                        }
                    }
                },
                "async": false,
                "model": "gpt-4o-global",
                "model_config": {
                    "auto_memory": false,
                    "max_record": 50,
                    "temperature": 0.5
                },
                "user_prompt": {
                    "id": "component-674c4f70bc485",
                    "version": "1",
                    "type": "value",
                    "structure": {
                        "type": "expression",
                        "const_value": null,
                        "expression_value": null
                    }
                }
            },
            "id": "563974408038580224",
            "node_id": "563974408038580224",
            "remark": "",
            "node_type": "15",
            "next_nodes": [],
            "meta": {
                "position": {
                    "x": 1580,
                    "y": 470
                }
            },
            "output": null,
            "input": {
                "widget": null,
                "form": null
            },
            "node_version": "v0",
            "name": "工具"
        }
    ],
    "creator": "usi_eb3a4884d3dda84e9a8d8644e9365c2c",
    "enabled": true,
    "modifier": "usi_eb3a4884d3dda84e9a8d8644e9365c2c",
    "created_at": "2025-01-02 18:01:21",
    "updated_at": "2025-01-02 18:01:21",
    "description": "测试等待节点",
    "tool_set_id": "not_grouped",
    "creator_info": null,
    "version_code": "",
    "modifier_info": null,
    "user_operation": 1,
    "global_variable": null
}