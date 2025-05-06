export default [
	{
		id: "ZFlNY7nk4BDIqpRHcyimPg",
		type: "chat",
		timestamp: 1741253711748,
		sender: "user",
		messageType: "text",
		content:
			"列出收盘同花顺的收盘点评作为参考。\n1.做出今日榜单总结\n2.列出明天板块方向\n3.做出短线策略\n4.完成一套A股股神秘籍，发到公众号参考。",
		attachments: [],
	},

	{
		id: "bydF9RUSQn7YKtKXLno8WP",
		type: "liveStatus",
		timestamp: 1741253711868,
		text: "初始化沙箱",
	},
	{
		id: "TEqAa1QAm4NDQ9O5n7vtYl",
		type: "sandboxUpdate",
		timestamp: 1741253712353,
		sandboxId: "itx5dbs5n1kzv3j1gni0q-3b13abc2",
		status: "running",
		codeServerUrl:
			"https://8329-itx5dbs5n1kzv3j1gni0q-3b13abc2.magic.computer/?folder=/home/ubuntu",
		vncUrl: "wss://5901-itx5dbs5n1kzv3j1gni0q-3b13abc2.magic.computer/vnc",
	},
	{
		type: "chat",
		messageType: "text",
		attachments: [],
		content:
			"您好！我已收到您的请求，我将帮您完成以下任务：\n1. 收集同花顺的收盘点评作为参考\n2. 做出今日榜单总结\n3. 列出明天板块方向\n4. 做出短线策略\n5. 完成一套A股股神秘籍，用于公众号参考\n\n我会立即开始收集相关信息并为您准备这些内容。请稍等片刻，我将分步骤完成这项工作。",
		id: "MupVZ7xvirBQcEpy8pvFKd",
		sender: "assistant",
		timestamp: 1741253716022,
		linkMetaMap: {},
	},
	{
		id: "GvEWVn4PN76v8h9w0idG8E",
		type: "liveStatus",
		timestamp: 1741253716530,
		text: "思考中",
	},
	{
		id: "Wqp0f4bpKMTSkW5kyCWprk",
		type: "knowledgeSuggested",
		timestamp: 1741253717997,
		brief: "建议的新知识",
		resources: [
			{
				title: "A股市场分析偏好",
			},
			{
				title: "A股投资内容创作偏好",
			},
		],
	},
	{
		id: "00kLp5g9KZOalmBqWYCK9G",
		type: "resourceAccessed",
		timestamp: 1741253731440,
		brief: "已连接到数据源",
		resourceType: "data_api",
		resources: [
			{
				id: "api_19",
				title: "Get stock chart",
				kind: "builtin",
			},
			{
				id: "api_21",
				title: "Get stock insights",
				kind: "builtin",
			},
		],
	},
	{
		id: "a1q0PN5CEiVT9Ii8h3Dtm7",
		type: "liveStatus",
		timestamp: 1741253731592,
		text: "思考中",
	},
	{
		id: "YIQbeUDTeckUMC016P1Hwv",
		type: "liveStatus",
		timestamp: 1741253731832,
		text: "思考中",
	},
	{
		id: "ohlBHU1Lf6539ZT7ammzNh",
		type: "liveStatus",
		timestamp: 1741253737662,
		text: "思考中",
	},
	{
		id: "xLKyzjdiek6adNfTPY01FN",
		type: "liveStatus",
		timestamp: 1741253737838,
		text: "思考中",
	},
	{
		id: "cwAyg4EnVDrL40rlVpUn4f",
		type: "statusUpdate",
		timestamp: 1741253737879,
		agentStatus: "running",
		brief: "Super Magic 正在工作",
		description: "开始搜索同花顺收盘点评信息",
		noRender: false,
		planStepId: "ejaP174ifbMzvkzrpKxmpj",
	},
	{
		id: "pV8WHaEh9bFrkCyRmqp5pq",
		type: "liveStatus",
		timestamp: 1741253741350,
		text: "使用终端",
	},
	{
		id: "01WO1nAly8lmaqONo7uvvP",
		type: "toolUsed",
		timestamp: 1741253742350,
		actionId: "toolu_01B2pbXqAY57XPmyzm14ThGc",
		tool: "terminal",
		status: "success",
		brief: "Super Magic 正在使用终端",
		description: "已执行命令 `mkdir -p /home/ubuntu/stock_analysis`",
		message: {
			action: "正在执行命令",
			param: "mkdir -p /home/ubuntu/stock_analysis",
		},
		detail: {
			terminal: {
				action: "execute",
				finished: true,
				shellId: "shell1",
				command: "mkdir -p /home/ubuntu/stock_analysis",
				outputType: "append",
				output: [
					"\u001b[32mubuntu@sandbox:~ $\u001b[0m cd /home/ubuntu && mkdir -p /home/ubuntu/stock_analysis\n\n\u001b[32mubuntu@sandbox:~ $\u001b[0m",
				],
			},
		},
		planStepId: "ejaP174ifbMzvkzrpKxmpj",
	},
	{
		id: "P9rdE6cG01nOSDWnUDyqzY",
		type: "liveStatus",
		timestamp: 1741253742823,
		text: "思考中",
	},
	{
		id: "epi8KvDZXEloIuYfcMWpCL",
		type: "planUpdate",
		timestamp: 1741253742914,
		tasks: [
			{
				id: "step_001",
				title: "搜索同花顺市场收盘点评",
				status: "doing",
				startedAt: 1741253742807,
			},
			{
				id: "step_002",
				title: "收集市场数据和榜单信息",
				status: "todo",
				startedAt: 1741253742807,
			},
			{
				id: "step_003",
				title: "分析市场趋势和板块方向",
				status: "todo",
				startedAt: 1741253742807,
			},
			{
				id: "step_004",
				title: "制定短线交易策略",
				status: "todo",
				startedAt: 1741253742807,
			},
			{
				id: "step_005",
				title: "编写A股投资股神秘籍",
				status: "todo",
				startedAt: 1741253742807,
			},
			{
				id: "step_006",
				title: "整合所有内容到最终文档",
				status: "todo",
				startedAt: 1741253742807,
			},
			{
				id: "step_007",
				title: "向用户交付结果",
				status: "todo",
				startedAt: 1741253742807,
			},
		],
	},
	{
		id: "zy6hf6xmfNvugqL8Tr91dW",
		type: "newPlanStep",
		timestamp: 1741253737835,
		title: "搜索同花顺市场收盘点评",
		stepId: "ejaP174ifbMzvkzrpKxmpj",
	},
	{
		id: "oxOw2T69aDtEMoNlJUDnTc",
		type: "liveStatus",
		timestamp: 1741253747819,
		text: "更新计划",
	},
	{
		id: "4nFnZSybu3BKjQpk0IsWy8",
		type: "liveStatus",
		timestamp: 1741253748327,
		text: "思考中",
	},
	{
		id: "iYUcpVHKbPgYGAsrvpuVlr",
		type: "statusUpdate",
		timestamp: 1741253748435,
		agentStatus: "running",
		brief: "Super Magic 正在工作",
		description: "正在搜索同花顺收盘点评信息",
		noRender: false,
		planStepId: "ejaP174ifbMzvkzrpKxmpj",
	},
	{
		id: "8W01StJ4dytlQ7KjejaOUg",
		type: "liveStatus",
		timestamp: 1741253753161,
		text: "编辑文件 stock_analysis/todo.md",
	},
	{
		id: "vIMUFVQVkAmX8HeUIMHxs0",
		type: "liveStatus",
		timestamp: 1741253753265,
		text: "思考中",
	},
	{
		id: "CKVQojj6MI6ShT7RTMaCtL",
		type: "toolUsed",
		timestamp: 1741253753304,
		actionId: "toolu_013F2n1h6eZaTJqeUHmRqRHC",
		tool: "text_editor",
		status: "success",
		planStepId: "ejaP174ifbMzvkzrpKxmpj",
		brief: "Super Magic 正在使用文本编辑器",
		description: "正在创建文件 `stock_analysis/todo.md`",
		message: {
			action: "正在创建文件",
			param: "stock_analysis/todo.md",
		},
		detail: {
			textEditor: {
				action: "write",
				path: "/home/ubuntu/stock_analysis/todo.md",
				content:
					"# A股分析任务清单\n\n## 数据收集\n- [ ] 搜索同花顺收盘点评\n- [ ] 收集最新的同花顺收盘点评内容\n- [ ] 收集今日市场数据和榜单\n\n## 分析与策略\n- [ ] 分析市场趋势和板块走向\n- [ ] 确定明天可能的热点板块\n- [ ] 制定短线交易策略\n\n## 内容创作\n- [ ] 编写今日榜单总结\n- [ ] 编写明天板块方向预测\n- [ ] 编写短线策略建议\n- [ ] 编写A股股神秘籍\n\n## 交付\n- [ ] 整合所有内容\n- [ ] 准备最终文档\n- [ ] 交付结果给用户\n",
				oldContent: "",
			},
		},
	},
	{
		id: "TFfewqQfYJ74OgB2FETaPd",
		type: "planUpdate",
		timestamp: 1741253753314,
		tasks: [
			{
				id: "step_001",
				title: "搜索同花顺市场收盘点评",
				status: "doing",
				startedAt: 1741253742807,
			},
			{
				id: "step_002",
				title: "收集市场数据和榜单信息",
				status: "todo",
				startedAt: 1741253742807,
			},
			{
				id: "step_003",
				title: "分析市场趋势和板块方向",
				status: "todo",
				startedAt: 1741253742807,
			},
			{
				id: "step_004",
				title: "制定短线交易策略",
				status: "todo",
				startedAt: 1741253742807,
			},
			{
				id: "step_005",
				title: "编写A股投资股神秘籍",
				status: "todo",
				startedAt: 1741253742807,
			},
			{
				id: "step_006",
				title: "整合所有内容到最终文档",
				status: "todo",
				startedAt: 1741253742807,
			},
			{
				id: "step_007",
				title: "向用户交付结果",
				status: "todo",
				startedAt: 1741253742807,
			},
		],
	},
	{
		id: "fOZxT17VMimqRddpZnfkpb",
		type: "liveStatus",
		timestamp: 1741253758978,
		text: "更新计划",
	},
	{
		id: "P4jVKEm207f1XNxuxfLorN",
		type: "liveStatus",
		timestamp: 1741253759018,
		text: "思考中",
	},
	{
		id: "yJsgNXBLfYq0qjZUiXLnPq",
		type: "statusUpdate",
		timestamp: 1741253759061,
		agentStatus: "running",
		brief: "Super Magic 正在工作",
		description: "继续搜索同花顺收盘点评信息",
		noRender: false,
		planStepId: "ejaP174ifbMzvkzrpKxmpj",
	},
	{
		id: "pxkWmJGClReyMStkVmeCcS",
		type: "liveStatus",
		timestamp: 1741253759194,
		text: "在网络上搜索 同花顺 收盘点评 最新",
	},
	{
		id: "9xZHfOk4URuqnKZZf5ZkTX",
		type: "liveStatus",
		timestamp: 1741253760984,
		text: "分析搜索结果",
	},
	{
		id: "by5zH8cXbFC1otMtkWHNTc",
		type: "toolUsed",
		timestamp: 1741253761142,
		actionId: "toolu_01XX7jUzDFk2hpzQBFLoYuPv",
		tool: "search",
		status: "success",
		brief: "Super Magic 正在搜索网络",
		description: "正在搜索 `同花顺 收盘点评 最新`",
		message: {
			action: "正在搜索",
			param: "同花顺 收盘点评 最新",
		},
		detail: {
			search: {
				queries: ["同花顺 收盘点评 最新"],
				results: [
					{
						favicon: "TODO",
						link: "https://www.10jqka.com.cn/",
						snippet:
							"核新同花顺网络信息股份有限公司（同花顺）成立于1995年,是一家专业的互联网金融数据服务商,为您全方位提供财经资讯及全球金融市场行情,覆盖股票、基金、期货、外汇、 ...",
						title: "手机同花顺财经__让投资变得更简单",
					},
					{
						favicon: "TODO",
						link: "http://stock.10jqka.com.cn/hsdp_list/",
						snippet:
							"截至收盘，沪指涨0.53%报3341.96点，深证成指涨0.28%报10709.46点，创业板指涨 ... 最新调查结果编制而成，也称“褐皮书”。报告显示，自1月中旬以来，整体经济活动 ...",
						title: "大盘分析_股票_同花顺财经",
					},
					{
						favicon: "TODO",
						link: "http://stock.10jqka.com.cn/jiepan_list/",
						snippet:
							"实时解盘_股票_同花顺财经 港股午评：恒生指数涨2.64%，恒生科技指数涨4.72% 03月06日12:00 港股午间收盘，恒生指数涨2.64%突破24000点再创阶段新高，恒生科技指数涨4.72%。 ...",
						title: "实时解盘_股票_同花顺财经",
					},
					{
						favicon: "TODO",
						link: "http://yuanchuang.10jqka.com.cn/djpingpan_list/",
						snippet:
							"A股收评：指数午后延续低位震荡元宇宙概念全天跌幅居前 02月22日15:00 指数午后延续低位震荡，沪指收跌1%，贵金属、燃气、盐湖提锂等多板块持续活跃，培育钻石板块涨幅居前， ...",
						title: "独家评盘_原创_同花顺财经",
					},
					{
						favicon: "TODO",
						link: "http://stock.10jqka.com.cn/usstock/mgscfx_list/",
						snippet:
							"新的预测表明该指数较周二收盘价还有12%的上涨空间。Sunil Koul等策略师预计中国股市将进一步上涨，因刺激措施有望稳定经济增长。 14:04【迈威尔科技四季度净营收18.2亿美元 ...",
						title: "美股市场分析_美股_同花顺财经 - 股票",
					},
					{
						favicon: "TODO",
						link: "http://data.10jqka.com.cn/",
						snippet:
							"龙虎榜 ; 华丰股份 0.08%, 恒为科技 -4.96%, 立航科技 5.80%, 杭齿前进 7.09%, 万达轴承 -6.84% ; 东方集团 -9.77%, 大丰实业 -9.97%, *ST信通 4.93%, *ST富润 -5.22%, 纵横 ...",
						title: "同花顺数据中心_同花顺金融网",
					},
					{
						favicon: "TODO",
						link: "http://quote.eastmoney.com/sz300033.html?jump_to_web=true",
						snippet:
							"提供同花顺(300033)股票的行情走势、五档盘口、逐笔交易等实时行情数据，及同花顺(300033)的新闻资讯、公司公告、研究报告、行业研报、F10资料、行业资讯、资金流分析、 ...",
						title: "同花顺(300033)_股票价格_行情_走势图—东方财富网",
					},
					{
						favicon: "TODO",
						link: "http://stock.10jqka.com.cn/bkfy_list/",
						snippet:
							"该变更将于2025年3月21日星期五收盘后生效。具体来看，市场关注度最高的富时中国A50指数本次将纳入寒武纪-U、中国联通以及国泰君安；中国广核、伊利股份、泸州老窖将被剔除。",
						title: "行业研究_股票_同花顺财经",
					},
					{
						favicon: "TODO",
						link: "https://www.iwencai.com/unifiedwap/result?w=300845",
						snippet:
							"最新 · 13.20 -5.24% ; 公司看点. 轨道交通仿真实训系统行业的主要供应商之一 ; 牛叉诊股. 同行排名. 61. 综合得分. 3.4. 持仓建议. 卖出 ; 同行排名. 61.",
						title: "公司看点 - 问财选股-同花顺旗下智能投顾平台",
					},
					{
						favicon: "TODO",
						link: "https://cn.investing.com/equities/hithink-royalflush-info-network-historical-data",
						snippet:
							"免费获取同花顺（300033）股票历史数据，用于同花顺股票投资参考。此历史数据包括近期和往年同花顺（300033）股票的历史行情，每日股价和价格涨跌走势图表。选择日期范围，可按每 ...",
						title: "同花顺(300033)股票历史数据:历史行情,价格,走势图表 - 英为财情",
					},
					{
						favicon: "TODO",
						link: "https://www.moomoo.com/hans/stock/300033-SZ",
						snippet:
							"用Moomoo查看同花顺(300033)的股票价格、新闻、历史走势图、分析师评级、财务信息和行情。使用Moomoo免佣金股票交易App进行交易。",
						title: "同花顺(300033) - 个股概要_股票价格 - Moomoo",
					},
					{
						favicon: "TODO",
						link: "https://q.stock.sohu.com/cn/300033/index.shtml",
						snippet:
							"同花顺(300033)的实时行情，及时准确的提供同花顺(300033)的flash分时走势、K线图、均价线系统、MACD、KDJ、交易量等全面技术分析，帮你做出及时判断， ...",
						title: "同花顺:301.16 -3.57% -11.14 300033 搜狐证券 - 搜狐股票",
					},
					{
						favicon: "TODO",
						link: "https://stock.10jqka.com.cn/",
						snippet:
							"同花顺公司频道为您提供专业及时的上市公司年报及上市公司财报数据，包括公司评级、个股聚焦、公司研究、公司公告、独家公司互动、上市公司最新公告，以及沪深股市上市 ...",
						title: "上市公司_上市公司公告_上市公司信息披露-股票频道-同花顺财经",
					},
					{
						favicon: "TODO",
						link: "https://data.eastmoney.com/gzfx/detail/300033.html",
						snippet:
							"东方财富网数据中心提供沪深两市最全面的估值分析数据，第一时间提供市场、行业及个股最新的估值指标信息，便利投资者确定它们的真实价值，并提供相关的参考依据。",
						title: "同花顺(300033)估值分析_数据中心_东方财富网",
					},
					{
						favicon: "TODO",
						link: "https://m.10jqka.com.cn/stock/",
						snippet:
							"手机同花顺股票频道提供全方位24小时全球股市行情及大盘，板块，个股，上市公司的资金流向、市场分析、公告等实时股票行情信息。",
						title: "股票频道-提供今日最新股票行情信息,股票投资新闻资讯 - 同花顺",
					},
					{
						favicon: "TODO",
						link: "https://www.iwencai.com/stockpick/search?w=300381",
						snippet:
							"分时; K线 ; 均价 · 7.50 ; 最新 · 7.39 -3.78% ; 公司看点. 我国第一家饲用酶制剂生产企业，国内最大的饲用酶制剂生产商 ; 牛叉诊股. 同行排名. 122. 综合得分. 3.9. 持仓建议.",
						title: "公司看点 - 问财选股-同花顺旗下智能投顾平台",
					},
					{
						favicon: "TODO",
						link: "https://cn.investing.com/equities/hithink-royalflush-info-network",
						snippet:
							"同花顺的资讯和分析评论 · Q4业绩大爆发！同花顺豪气分红，拟每10股派发30元 · A股收市：上证指数震荡收升0.4% 分析师指三大原因致A股調整 · A股券商股多数跳水，华林证券跌近7%、 ...",
						title: "同花顺(300033)股票最新价格行情,实时走势图,股价分析预测 - 英为财情",
					},
					{
						favicon: "TODO",
						link: "http://stock.10jqka.com.cn/gngyw_list/",
						snippet:
							"黄金概念股一览 03月04日13:09 纽约黄金期货价格周四收盘上涨，突破了每盎司1250美元的关键阻力位，创下一年多以来的最高收盘价。纽约商品交易所4月份交割的黄金期货价格上涨 ...",
						title: "最新热点概念股一览_股票_同花顺财经",
					},
					{
						favicon: "TODO",
						link: "https://stock.10jqka.com.cn/fupan/",
						snippet:
							"A股三大指数今日集体反弹，截至收盘，沪指涨0.53%，深成指涨0.28%，创业板指涨0.01%，北证50指数涨2.82%。全市场成交额15457亿元，较上日放量658亿元。",
						title: "复盘_股票_同花顺财经",
					},
					{
						favicon: "TODO",
						link: "https://pdf.dfcfw.com/pdf/H3_AP202408251639443688_1.pdf?1724615731000.pdf",
						snippet:
							"[Table_Tag]. [Table_Summary]. 事件：2024 上半年，公司实现营业总收入同比-5.51%至13.89 亿元，归母. 净利润同比-20.99%至3.63 亿元，扣非净利润 ...",
						title: "[PDF] 同花顺（300033） 2024 年半年报点评：C 端业务短期承压",
					},
				],
			},
		},
		planStepId: "ejaP174ifbMzvkzrpKxmpj",
	},
	{
		id: "vOTYZUpTWNN7r2dQOWHRkK",
		type: "liveStatus",
		timestamp: 1741253764058,
		text: "思考中",
	},
	{
		id: "6ABY7ILwzruAErKAekDOn1",
		type: "planUpdate",
		timestamp: 1741253764111,
		tasks: [
			{
				id: "step_001",
				title: "搜索同花顺市场收盘点评",
				status: "doing",
				startedAt: 1741253742807,
			},
			{
				id: "step_002",
				title: "收集市场数据和榜单信息",
				status: "todo",
				startedAt: 1741253742807,
			},
			{
				id: "step_003",
				title: "分析市场趋势和板块方向",
				status: "todo",
				startedAt: 1741253742807,
			},
			{
				id: "step_004",
				title: "制定短线交易策略",
				status: "todo",
				startedAt: 1741253742807,
			},
			{
				id: "step_005",
				title: "编写A股投资股神秘籍",
				status: "todo",
				startedAt: 1741253742807,
			},
			{
				id: "step_006",
				title: "整合所有内容到最终文档",
				status: "todo",
				startedAt: 1741253742807,
			},
			{
				id: "step_007",
				title: "向用户交付结果",
				status: "todo",
				startedAt: 1741253742807,
			},
		],
	},
	{
		id: "roydl7GwSXBZeBsuhFAamk",
		type: "liveStatus",
		timestamp: 1741253766187,
		text: "更新计划",
	},
	{
		id: "wnlU8Qtz2yyJEUFlsivUSX",
		type: "liveStatus",
		timestamp: 1741253766296,
		text: "思考中",
	},
	{
		id: "oOEPUriH2ZSFs8CGbFhLx6",
		type: "statusUpdate",
		timestamp: 1741253766406,
		agentStatus: "running",
		brief: "Super Magic 正在工作",
		description: "正在浏览同花顺收盘点评相关网页",
		noRender: false,
		planStepId: "ejaP174ifbMzvkzrpKxmpj",
	},
	{
		id: "blS24GHOifdFcdny4YLaq8",
		type: "liveStatus",
		timestamp: 1741253767891,
		text: "使用浏览器",
	},
	{
		id: "0euw189vbaLBEVoZPDVrxW",
		type: "liveStatus",
		timestamp: 1741253771283,
		text: "思考中",
	},
	{
		id: "urlBcGUUbQ7ovgPSkuLMRr",
		type: "planUpdate",
		timestamp: 1741253771342,
		tasks: [
			{
				id: "step_001",
				title: "搜索同花顺市场收盘点评",
				status: "doing",
				startedAt: 1741253742807,
			},
			{
				id: "step_002",
				title: "收集市场数据和榜单信息",
				status: "todo",
				startedAt: 1741253742807,
			},
			{
				id: "step_003",
				title: "分析市场趋势和板块方向",
				status: "todo",
				startedAt: 1741253742807,
			},
			{
				id: "step_004",
				title: "制定短线交易策略",
				status: "todo",
				startedAt: 1741253742807,
			},
			{
				id: "step_005",
				title: "编写A股投资股神秘籍",
				status: "todo",
				startedAt: 1741253742807,
			},
			{
				id: "step_006",
				title: "整合所有内容到最终文档",
				status: "todo",
				startedAt: 1741253742807,
			},
			{
				id: "step_007",
				title: "向用户交付结果",
				status: "todo",
				startedAt: 1741253742807,
			},
		],
	},
	{
		id: "7GOmAAL7mEaF28tpCnZoEG",
		type: "toolUsed",
		timestamp: 1741253813592,
		actionId: "toolu_01WtfvxvpoZ68UpQU6exJHbC",
		tool: "browser",
		status: "success",
		brief: "Super Magic 正在使用浏览器",
		description: "正在浏览 `http://stock.10jqka.com.cn/jiepan_list/`",
		message: {
			action: "正在浏览",
			param: "http://stock.10jqka.com.cn/jiepan_list/",
		},
		detail: {
			terminal: {
				action: "execute",
				finished: true,
				shellId: "shell1",
				command: "mkdir -p /home/ubuntu/stock_analysis",
				outputType: "append",
				output: [
					"\u001b[32mubuntu@sandbox:~ $\u001b[0m cd /home/ubuntu && mkdir -p /home/ubuntu/stock_analysis\n\n\u001b[32mubuntu@sandbox:~ $\u001b[0m",
				],
			},
		},
		planStepId: "ejaP174ifbMzvkzrpKxmpj",
	},
	{
		id: "NJ9sneL2JShVfrDjadTXLK",
		type: "liveStatus",
		timestamp: 1741253813593,
		text: "查看浏览器",
	},
	{
		id: "sZkc6PyOWJKREGXLJ4MRzg",
		type: "liveStatus",
		timestamp: 1741253836795,
		text: "更新计划",
	},
	{
		id: "eHLptPnUui151A3fNetATV",
		type: "liveStatus",
		timestamp: 1741253836829,
		text: "思考中",
	},
	{
		id: "Rs1CRraI6tVAh8fnBYjn3l",
		type: "statusUpdate",
		timestamp: 1741253836902,
		agentStatus: "running",
		brief: "Super Magic 正在工作",
		description: "正在收集同花顺收盘点评信息",
		noRender: false,
		planStepId: "ejaP174ifbMzvkzrpKxmpj",
	},
	{
		id: "mR8M053AUjuj9XxSrqqWUo",
		type: "liveStatus",
		timestamp: 1741253841767,
		text: "思考中",
	},
	{
		id: "pyhuJEExP3rN23iFl9zG9Z",
		type: "planUpdate",
		timestamp: 1741253841838,
		tasks: [
			{
				id: "step_001",
				title: "搜索同花顺市场收盘点评",
				status: "doing",
				startedAt: 1741253742807,
			},
			{
				id: "step_002",
				title: "收集市场数据和榜单信息",
				status: "todo",
				startedAt: 1741253742807,
			},
			{
				id: "step_003",
				title: "分析市场趋势和板块方向",
				status: "todo",
				startedAt: 1741253742807,
			},
			{
				id: "step_004",
				title: "制定短线交易策略",
				status: "todo",
				startedAt: 1741253742807,
			},
			{
				id: "step_005",
				title: "编写A股投资股神秘籍",
				status: "todo",
				startedAt: 1741253742807,
			},
			{
				id: "step_006",
				title: "整合所有内容到最终文档",
				status: "todo",
				startedAt: 1741253742807,
			},
			{
				id: "step_007",
				title: "向用户交付结果",
				status: "todo",
				startedAt: 1741253742807,
			},
		],
	},
]
