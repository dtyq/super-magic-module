

export const tools = [
    {
        "id": "MAGIC-FLOW-66c8f8dc35b4d5-88653163",
        "name": "internet_search",
        "description": "当你回答非逻辑性问题或非聊天类问题时，尤其是时事、经济、商业、学术、科研、政治类问题，可以调用此工具从互联网上搜索实时信息来辅助回答。输入的搜索查询词长度不得少于 5 个字符，如果搜索查询词少于 5 个字符，则需要扩展搜索关键词。",
        "icon": "",
        "type": 3,
        "enabled": true,
        "creator": "677224154897461248",
        "created_at": "2024-08-24 05:02:20",
        "modifier": "677224154897461248",
        "updated_at": "2024-08-25 12:29:36",
        "creator_info": {
            "id": "677224154897461248",
            "name": "黄朝晖",
            "avatar": "https://static-legacy.dingtalk.com/media/lADPBE1XYIoOpdnNCoDNCoA_2688_2688.jpg"
        },
        "modifier_info": {
            "id": "677224154897461248",
            "name": "黄朝晖",
            "avatar": "https://static-legacy.dingtalk.com/media/lADPBE1XYIoOpdnNCoDNCoA_2688_2688.jpg"
        },
		"input": {
            "widget": null,
            "form": {
                "id": "component-66a1bd9ea09e0",
                "version": "1",
                "type": "form",
                "structure": {
                    "type": "object",
                    "key": "root",
                    "sort": 0,
                    "title": null,
                    "description": null,
                    "required": [
                        "keyword"
                    ],
                    "value": null,
                    "items": null,
                    "properties": {
                        "keyword": {
                            "type": "string",
                            "key": "keyword",
                            "sort": 0,
                            "title": "搜索关键词",
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
                "id": "component-66a1f6bfe084f",
                "version": "1",
                "type": "form",
                "structure": {
                    "type": "object",
                    "key": "root",
                    "sort": 0,
                    "title": null,
                    "description": null,
                    "required": [
                        "results"
                    ],
                    "value": null,
                    "items": null,
                    "properties": {
                        "results": {
                            "type": "string",
                            "key": "results",
                            "sort": 0,
                            "title": "搜索结果",
                            "description": "",
                            "required": null,
                            "value": {
                                "type": "expression",
                                "const_value": null,
                                "expression_value": [
                                    {
                                        "type": "fields",
                                        "value": "487403869480779776.context_string",
                                        "name": "",
                                        "args": null
                                    }
                                ]
                            },
                            "items": null,
                            "properties": null
                        }
                    }
                }
            }
        }
    },
    {
        "id": "MAGIC-FLOW-66cab252011486-69458896",
        "name": "long_term_memory",
        "description": "管理用户与 AI 之间的长期记忆",
        "icon": "",
        "type": 3,
        "enabled": false,
        "creator": "677224154897461248",
        "created_at": "2024-08-25 12:25:54",
        "modifier": "677224154897461248",
        "updated_at": "2024-08-25 12:25:54",
        "creator_info": {
            "id": "677224154897461248",
            "name": "黄朝晖",
            "avatar": "https://static-legacy.dingtalk.com/media/lADPBE1XYIoOpdnNCoDNCoA_2688_2688.jpg"
        },
        "modifier_info": {
            "id": "677224154897461248",
            "name": "黄朝晖",
            "avatar": "https://static-legacy.dingtalk.com/media/lADPBE1XYIoOpdnNCoDNCoA_2688_2688.jpg"
        },
		"input": {
            "widget": null,
            "form": {
                "id": "component-6682490b07664",
                "version": "1",
                "type": "form",
                "structure": {
                    "type": "object",
                    "key": "root",
                    "sort": 0,
                    "title": null,
                    "description": null,
                    "required": [
                        "city_name"
                    ],
                    "value": null,
                    "items": null,
                    "properties": {
                        "city_name": {
                            "type": "string",
                            "key": "city_name",
                            "sort": 0,
                            "title": "城市名称",
                            "description": "城市名称",
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
                "id": "component-66824f7408728",
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
                    "properties": {
                        "days": {
                            "type": "string",
                            "key": "days",
                            "sort": 0,
                            "title": null,
                            "description": null,
                            "required": null,
                            "value": {
                                "type": "expression",
                                "const_value": null,
                                "expression_value": [
                                    {
                                        "type": "fields",
                                        "value": "MAGIC-FLOW-NODE-66825533023496-81759173.result.days",
                                        "name": "input",
                                        "args": null
                                    }
                                ]
                            },
                            "items": null,
                            "properties": null
                        },
                        "humidity": {
                            "type": "string",
                            "key": "humidity",
                            "sort": 1,
                            "title": null,
                            "description": null,
                            "required": null,
                            "value": {
                                "type": "expression",
                                "const_value": null,
                                "expression_value": [
                                    {
                                        "type": "fields",
                                        "value": "MAGIC-FLOW-NODE-66825533023496-81759173.result.humidity",
                                        "name": "input",
                                        "args": null
                                    }
                                ]
                            },
                            "items": null,
                            "properties": null
                        },
                        "week": {
                            "type": "string",
                            "key": "week",
                            "sort": 2,
                            "title": null,
                            "description": null,
                            "required": null,
                            "value": {
                                "type": "expression",
                                "const_value": null,
                                "expression_value": [
                                    {
                                        "type": "fields",
                                        "value": "MAGIC-FLOW-NODE-66825533023496-81759173.result.week",
                                        "name": "input",
                                        "args": null
                                    }
                                ]
                            },
                            "items": null,
                            "properties": null
                        },
                        "citynm": {
                            "type": "string",
                            "key": "citynm",
                            "sort": 3,
                            "title": null,
                            "description": null,
                            "required": null,
                            "value": {
                                "type": "expression",
                                "const_value": null,
                                "expression_value": [
                                    {
                                        "type": "fields",
                                        "value": "MAGIC-FLOW-NODE-66825533023496-81759173.result.citynm",
                                        "name": "input",
                                        "args": null
                                    }
                                ]
                            },
                            "items": null,
                            "properties": null
                        },
                        "temperature": {
                            "type": "string",
                            "key": "temperature",
                            "sort": 4,
                            "title": null,
                            "description": null,
                            "required": null,
                            "value": {
                                "type": "expression",
                                "const_value": null,
                                "expression_value": [
                                    {
                                        "type": "fields",
                                        "value": "MAGIC-FLOW-NODE-66825533023496-81759173.result.temperature",
                                        "name": "input",
                                        "args": null
                                    }
                                ]
                            },
                            "items": null,
                            "properties": null
                        },
                        "temperature_curr": {
                            "type": "string",
                            "key": "temperature_curr",
                            "sort": 5,
                            "title": null,
                            "description": null,
                            "required": null,
                            "value": {
                                "type": "expression",
                                "const_value": null,
                                "expression_value": [
                                    {
                                        "type": "fields",
                                        "value": "MAGIC-FLOW-NODE-66825533023496-81759173.result.temperature_curr",
                                        "name": "input",
                                        "args": null
                                    }
                                ]
                            },
                            "items": null,
                            "properties": null
                        },
                        "weather": {
                            "type": "string",
                            "key": "weather",
                            "sort": 6,
                            "title": null,
                            "description": null,
                            "required": null,
                            "value": {
                                "type": "expression",
                                "const_value": null,
                                "expression_value": [
                                    {
                                        "type": "fields",
                                        "value": "MAGIC-FLOW-NODE-66825533023496-81759173.result.weather",
                                        "name": "input",
                                        "args": null
                                    }
                                ]
                            },
                            "items": null,
                            "properties": null
                        },
                        "weather_curr": {
                            "type": "string",
                            "key": "weather_curr",
                            "sort": 7,
                            "title": null,
                            "description": null,
                            "required": null,
                            "value": {
                                "type": "expression",
                                "const_value": null,
                                "expression_value": [
                                    {
                                        "type": "fields",
                                        "value": "MAGIC-FLOW-NODE-66825533023496-81759173.result.weather_curr",
                                        "name": "input",
                                        "args": null
                                    }
                                ]
                            },
                            "items": null,
                            "properties": null
                        },
                        "wind": {
                            "type": "string",
                            "key": "wind",
                            "sort": 8,
                            "title": null,
                            "description": null,
                            "required": null,
                            "value": {
                                "type": "expression",
                                "const_value": null,
                                "expression_value": [
                                    {
                                        "type": "fields",
                                        "value": "MAGIC-FLOW-NODE-66825533023496-81759173.result.wind",
                                        "name": "input",
                                        "args": null
                                    }
                                ]
                            },
                            "items": null,
                            "properties": null
                        },
                        "winp": {
                            "type": "string",
                            "key": "winp",
                            "sort": 9,
                            "title": null,
                            "description": null,
                            "required": null,
                            "value": {
                                "type": "expression",
                                "const_value": null,
                                "expression_value": [
                                    {
                                        "type": "fields",
                                        "value": "MAGIC-FLOW-NODE-66825533023496-81759173.result.winp",
                                        "name": "input",
                                        "args": null
                                    }
                                ]
                            },
                            "items": null,
                            "properties": null
                        },
                        "temp_high": {
                            "type": "string",
                            "key": "temp_high",
                            "sort": 10,
                            "title": null,
                            "description": null,
                            "required": null,
                            "value": {
                                "type": "expression",
                                "const_value": null,
                                "expression_value": [
                                    {
                                        "type": "fields",
                                        "value": "MAGIC-FLOW-NODE-66825533023496-81759173.result.temp_high",
                                        "name": "input",
                                        "args": null
                                    }
                                ]
                            },
                            "items": null,
                            "properties": null
                        },
                        "temp_low": {
                            "type": "string",
                            "key": "temp_low",
                            "sort": 11,
                            "title": null,
                            "description": null,
                            "required": null,
                            "value": {
                                "type": "expression",
                                "const_value": null,
                                "expression_value": [
                                    {
                                        "type": "fields",
                                        "value": "MAGIC-FLOW-NODE-66825533023496-81759173.result.temp_low",
                                        "name": "input",
                                        "args": null
                                    }
                                ]
                            },
                            "items": null,
                            "properties": null
                        },
                        "temp_curr": {
                            "type": "string",
                            "key": "temp_curr",
                            "sort": 12,
                            "title": null,
                            "description": null,
                            "required": null,
                            "value": {
                                "type": "expression",
                                "const_value": null,
                                "expression_value": [
                                    {
                                        "type": "fields",
                                        "value": "MAGIC-FLOW-NODE-66825533023496-81759173.result.temp_curr",
                                        "name": "input",
                                        "args": null
                                    }
                                ]
                            },
                            "items": null,
                            "properties": null
                        }
                    }
                }
            }
        }
    },
]