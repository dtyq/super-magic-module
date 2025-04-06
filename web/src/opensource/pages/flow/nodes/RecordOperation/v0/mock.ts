import { Schema, type Sheet } from "@/types/sheet"

export const fileOptions = [
	{
		value: "675483331738578945",
		label: "SaaS测试文件",
	},
	{
		value: "708280703360266240",
		label: "SaaS测试文件_副本",
	},
]

export const mockColumns: Record<string, Sheet.Column> = {
	"7FQgdZNs": {
		id: "7FQgdZNs",
		label: "多行文本",
		columnType: Schema.TEXT,
		columnProps: {},
	},
	Fq8G8aQT: {
		id: "Fq8G8aQT",
		label: "日期",
		columnType: Schema.DATE,
		columnProps: {
			format: "YYYY-MM-DD",
		},
	},
	DeoJiU8P: {
		id: "DeoJiU8P",
		label: "数值",
		columnType: Schema.NUMBER,
		columnProps: {
			format: "1.0",
			renderType: "NUMBER",
			prefix: "",
			suffix: "",
		},
	},
	SUfAG93B: {
		id: "SUfAG93B",
		label: "多选",
		columnType: Schema.MULTIPLE,
		columnProps: {
			options: [],
		},
	},
	q8nsdIYr: {
		id: "q8nsdIYr",
		label: "结束时间",
		columnType: Schema.DATE,
		columnProps: {
			format: "YYYY-MM-DD",
		},
	},
	q8nsdIYd: {
		id: "q8nsdIYd",
		label: "是否完成",
		columnType: Schema.CHECKBOX,
		columnProps: {},
	},
}

export const mockDataTemplate = {
	"655044713557733376": {
		id: "655044713557733376",
		name: "数据表 1",
		content: {
			primaryKey: "7FQgdZNs",
			columns: mockColumns,
			views: {
				wjxb2au0: {
					viewId: "wjxb2au0",
					viewName: "表格视图",
					viewType: "Table",
					viewConfig: {
						rowHeight: 31,
					},
					groups: [],
					sorts: [],
					searches: {
						groups: [],
						conjunction: "and",
					},
					columnsConfig: {
						"7FQgdZNs": {
							width: 413,
							visible: true,
							statisticsType: "RowCount",
						},
						Fq8G8aQT: {
							width: 200,
							visible: true,
							statisticsType: "",
						},
						DeoJiU8P: {
							width: 200,
							visible: true,
							statisticsType: "",
						},
						SUfAG93B: {
							width: 200,
							visible: true,
							statisticsType: "",
						},
						q8nsdIYr: {
							width: 200,
							visible: true,
							statisticsType: "",
						},
					},
					rowIndexes: [
						"NMWAlrSr",
						"gybff9xQ",
						"o7HIdw2X",
						"wsCE97JE",
						"l5KG8VGK",
						"EwCi8FIT",
						"MYei2KEo",
						"QtSvxtex",
						"w8SYmwQH",
						"CNvE3Z5n",
						"NUZNGTvj",
						"sCI8BDj4",
						"T5Euf4gR",
						"FkXhOUMP",
						"qYB4r1CQ",
						"Wk4UY50H",
						"coYOhfhJ",
						"niPG2YF1",
						"koa8MraV",
						"LB6YziGa",
						"cXXGsqWu",
						"HBkY6381",
						"gtV7S7zg",
						"o9Xg5v0A",
						"tSAmpex8",
						"e5TzXJzT",
						"e2cyItSE",
						"VYl7mUi7",
						"zPagkaxv",
						"JCGI5KHk",
						"UDGDQmiX",
						"MLqkd1w4",
						"SzRZIopA",
					],
					columnIndices: ["7FQgdZNs", "Fq8G8aQT", "DeoJiU8P", "SUfAG93B", "q8nsdIYr"],
					viewProtectedType: "public",
					creator: {
						id: "430379931150888960",
						real_name: "蔡伦多",
						avatar: "https://static-legacy.dingtalk.com/media/lADPD3lG5dW_3IjNAgzNAeA_480_524.jpg",
						description: "",
						position: "管培生",
						department: null,
					},
					modifier: {
						id: "430379931150888960",
						real_name: "蔡伦多",
						avatar: "https://static-legacy.dingtalk.com/media/lADPD3lG5dW_3IjNAgzNAeA_480_524.jpg",
						description: "",
						position: "管培生",
						department: null,
					},
					frozenColumnId: "Fq8G8aQT",
				},
			},
			viewIndices: ["wjxb2au0"],
		},
		draft_content: [],
		creator: {
			id: "430379931150888960",
			real_name: "蔡伦多",
			avatar: "https://static-legacy.dingtalk.com/media/lADPD3lG5dW_3IjNAgzNAeA_480_524.jpg",
			description: "",
			position: "管培生",
			department: null,
		},
		modifier: {
			id: "430379931150888960",
			real_name: "蔡伦多",
			avatar: "https://static-legacy.dingtalk.com/media/lADPD3lG5dW_3IjNAgzNAeA_480_524.jpg",
			description: "",
			position: "管培生",
			department: null,
		},
		created_at: "2024-01-30 16:20:13",
		updated_at: "2024-01-30 17:20:38",
		type: 1,
		unread_announcement_count: 0,
	},
}

export const mockSheets = {
	sheets: {
		"509664747135885312": {
			id: "509664747135885312",
			name: "切换用的表",
			content: {
				primaryKey: "tT66QcTN",
				columns: {
					tT66QcTN: {
						id: "tT66QcTN",
						label: "多行文本",
						columnType: "TEXT",
						columnProps: [],
					},
					a0Fv5sBn: {
						id: "a0Fv5sBn",
						label: "日期",
						columnType: "DATETIME",
						columnProps: {
							format: "YYYY-MM-DD",
						},
					},
					DL9QPq5F: {
						id: "DL9QPq5F",
						label: "数值",
						columnType: "NUMBER",
						columnProps: {
							format: "1.0",
							renderType: "NUMBER",
							prefix: "",
							suffix: "",
						},
					},
					VvHwRuoI: {
						id: "VvHwRuoI",
						label: "多选",
						columnType: "MULTIPLE",
						columnProps: {
							options: [],
						},
					},
					UWvoRnPt: {
						id: "UWvoRnPt",
						label: "结束时间",
						columnType: "DATETIME",
						columnProps: {
							format: "YYYY-MM-DD",
						},
					},
				},
				views: {
					qY0xtU6D: {
						viewId: "qY0xtU6D",
						viewName: "表格视图",
						viewType: "Table",
						viewConfig: {
							rowHeight: 31,
						},
						groups: [],
						sorts: [],
						searches: {
							groups: [],
							conjunction: "and",
						},
						columnsConfig: {
							tT66QcTN: {
								width: 200,
								visible: true,
								statisticsType: "RowCount",
							},
							a0Fv5sBn: {
								width: 200,
								visible: true,
								statisticsType: "",
							},
							DL9QPq5F: {
								width: 200,
								visible: true,
								statisticsType: "",
							},
							VvHwRuoI: {
								width: 200,
								visible: true,
								statisticsType: "",
							},
							UWvoRnPt: {
								width: 200,
								visible: true,
								statisticsType: "",
							},
						},
						rowIndexes: [],
						columnIndices: ["tT66QcTN", "a0Fv5sBn", "DL9QPq5F", "VvHwRuoI", "UWvoRnPt"],
						viewProtectedType: "public",
						creator: {
							id: "606488063299981312",
							real_name: "蔡伦多",
							avatar: "https://static-legacy.dingtalk.com/media/lADPD3lG5dW_3IjNAgzNAeA_480_524.jpg",
							description: "",
							position: "",
							department: null,
						},
						frozenColumnId: "tT66QcTN",
						modifier: {
							id: "606488063299981312",
							real_name: "蔡伦多",
							avatar: "https://static-legacy.dingtalk.com/media/lADPD3lG5dW_3IjNAgzNAeA_480_524.jpg",
							description: "",
							position: "",
							department: null,
						},
					},
				},
				viewIndices: ["qY0xtU6D"],
			},
			draft_content: [],
			creator: {
				id: "606488063299981312",
				real_name: "蔡伦多",
				avatar: "https://static-legacy.dingtalk.com/media/lADPD3lG5dW_3IjNAgzNAeA_480_524.jpg",
				description: "",
				position: "",
				department: null,
			},
			modifier: {
				id: "606488063299981312",
				real_name: "蔡伦多",
				avatar: "https://static-legacy.dingtalk.com/media/lADPD3lG5dW_3IjNAgzNAeA_480_524.jpg",
				description: "",
				position: "",
				department: null,
			},
			created_at: "2024-10-25 17:45:44",
			updated_at: "2024-10-25 17:45:49",
			type: 1,
			unread_announcement_count: 0,
		},
		"708280703528038400": {
			id: "708280703528038400",
			name: "测试的表",
			content: {
				primaryKey: "0u9cna0w",
				columns: {
					"0u9cna0w": {
						id: "0u9cna0w",
						label: "多行文本",
						columnType: "TEXT",
						columnProps: [],
					},
					RiYbsFEF: {
						id: "RiYbsFEF",
						label: "日期",
						columnType: "DATETIME",
						columnProps: {
							format: "YYYY-MM-DD",
						},
					},
					YH94JSRb: {
						id: "YH94JSRb",
						label: "数值",
						columnType: "NUMBER",
						columnProps: {
							format: "1.0",
							renderType: "NUMBER",
							prefix: "",
							suffix: "",
						},
					},
					Msg4lFnO: {
						id: "Msg4lFnO",
						columnType: "MULTIPLE",
						columnProps: {
							options: [
								{
									id: "I2S88x1729849490758",
									label: "A选项",
									color: "#FEEAD4",
								},
								{
									id: "pHb14s1729849497781",
									label: "B选项",
									color: "#DAF3FD",
								},
							],
						},
						defaultValue: [],
						label: "多选",
					},
					DRCdelSj: {
						id: "DRCdelSj",
						label: "结束时间",
						columnType: "DATETIME",
						columnProps: {
							format: "YYYY-MM-DD",
						},
					},
					g0LkKEVU: {
						id: "g0LkKEVU",
						columnType: "CHECKBOX",
						columnProps: {
							value: false,
						},
						label: "勾选",
					},
					pv8fW2CC: {
						id: "pv8fW2CC",
						columnType: "SELECT",
						columnProps: {
							options: [
								{
									id: "UaKQNN1729849508845",
									label: "单选1",
									color: "#FEEAD4",
								},
								{
									id: "nChRdV1729849511606",
									label: "单选2",
									color: "#DAF3FD",
								},
							],
						},
						defaultValue: null,
						label: "单选",
					},
					dqYQGvAk: {
						id: "dqYQGvAk",
						label: "成员",
						columnType: "MEMBER",
						columnProps: {
							multiple: true,
							hasMoreInfo: false,
							moreFields: [],
						},
					},
				},
				views: {
					lFSLtUfn: {
						viewId: "lFSLtUfn",
						viewName: "表格视图",
						viewType: "Table",
						viewProtectedType: "public",
						viewConfig: {
							rowHeight: 31,
						},
						groups: [],
						sorts: [],
						searches: {
							conjunction: "and",
							groups: [],
						},
						columnsConfig: {
							"0u9cna0w": {
								width: 200,
								visible: true,
								sort: 1,
								statisticsType: "RowCount",
							},
							RiYbsFEF: {
								width: 200,
								visible: true,
								sort: 2,
							},
							YH94JSRb: {
								width: 200,
								visible: true,
								sort: 3,
							},
							Msg4lFnO: {
								visible: true,
								width: 200,
							},
							DRCdelSj: {
								width: 200,
								visible: true,
								sort: 5,
							},
							g0LkKEVU: {
								width: 200,
								visible: true,
								statisticsType: "",
							},
							pv8fW2CC: {
								width: 200,
								visible: true,
								statisticsType: "",
							},
							dqYQGvAk: {
								width: 200,
								visible: true,
								statisticsType: "",
							},
						},
						columnIndices: [
							"0u9cna0w",
							"RiYbsFEF",
							"YH94JSRb",
							"Msg4lFnO",
							"DRCdelSj",
							"g0LkKEVU",
							"pv8fW2CC",
							"dqYQGvAk",
						],
						rowIndexes: ["Yvl7tS3B", "Y2pbiLYW"],
						sort_number: 1,
						creator: {
							id: "606488063299981312",
							real_name: "蔡伦多",
							avatar: "https://static-legacy.dingtalk.com/media/lADPD3lG5dW_3IjNAgzNAeA_480_524.jpg",
							description: "",
							position: "",
							department: null,
						},
						modifier: {
							id: "606488063299981312",
							real_name: "蔡伦多",
							avatar: "https://static-legacy.dingtalk.com/media/lADPD3lG5dW_3IjNAgzNAeA_480_524.jpg",
							description: "",
							position: "",
							department: null,
						},
						autoSort: false,
						ganttConfig: [],
						frozenColumnId: "0u9cna0w",
					},
				},
				viewIndices: ["lFSLtUfn"],
			},
			draft_content: [],
			creator: {
				id: "606488063299981312",
				real_name: "蔡伦多",
				avatar: "https://static-legacy.dingtalk.com/media/lADPD3lG5dW_3IjNAgzNAeA_480_524.jpg",
				description: "",
				position: "",
				department: null,
			},
			modifier: {
				id: "606488063299981312",
				real_name: "蔡伦多",
				avatar: "https://static-legacy.dingtalk.com/media/lADPD3lG5dW_3IjNAgzNAeA_480_524.jpg",
				description: "",
				position: "",
				department: null,
			},
			created_at: "2024-07-26 23:29:36",
			updated_at: "2024-10-25 17:45:42",
			type: 1,
			unread_announcement_count: 0,
		},
	},
}
