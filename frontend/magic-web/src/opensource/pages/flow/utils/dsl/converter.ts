//@ts-nocheck
/**
 * DSL转换工具
 * 提供YAML DSL和Flow JSON格式之间的互相转换功能
 */

import yaml from "js-yaml"
import { v4 as uuidv4 } from "uuid"
import { customNodeType } from "../../constants"
import nodeMapping from "./nodeMapping"

// #region 类型定义

interface Position {
	x: number
	y: number
}

interface Edge {
	id: string
	source: string
	target: string
	sourceHandle?: string
	targetHandle?: string
	type: string
	data?: any
	style?: any
	markerEnd?: any
	selected?: boolean
}

interface Node {
	id: string
	node_id: string
	node_type: string
	node_version: string
	name: string
	description?: string
	position: Position
	params: any
	meta: any
	next_nodes: string[]
	step: number
	data: any
	system_output: any
}

interface Flow {
	id: string
	name: string
	description: string
	icon: string
	type: number
	tool_set_id: string
	edges: Edge[]
	nodes: Node[]
	global_variable: any
	enabled: boolean
	version_code: string
	creator?: string
	created_at?: string
	modifier?: string
	updated_at?: string
	creator_info?: any
	modifier_info?: any
	user_operation?: number
}

interface DSLNode {
	data: {
		type: string
		desc: string
		[key: string]: any
	}
	id: string
	position: Position
	type: string
	width: number
	height?: number
	dragging?: boolean
	selected?: boolean
	positionAbsolute?: Position
	sourcePosition?: string
	targetPosition?: string
}

interface DSLEdge {
	data: {
		sourceType: string
		targetType: string
		[key: string]: any
	}
	id: string
	source: string
	sourceHandle?: string
	target: string
	targetHandle?: string
	type: string
	selected?: boolean
}

interface DSL {
	app: {
		name: string
		description: string
		icon: string
		icon_background: string
		mode: string
		use_icon_as_answer_icon: boolean
	}
	dependencies: any[]
	kind: string
	version: string
	workflow: {
		conversation_variables: any[]
		environment_variables: any[]
		features: any
		graph: {
			edges: DSLEdge[]
			nodes: DSLNode[]
			viewport?: {
				x: number
				y: number
				zoom: number
			}
		}
	}
}

// #endregion

// #region DSL 转 JSON 相关函数

/**
 * 获取节点类型映射
 * @param yamlType YAML节点类型
 * @returns Flow节点类型
 */
const getNodeTypeByYamlType = (yamlType: string): string => {
	for (const key in nodeMapping) {
		if (nodeMapping[key].yaml_type === yamlType) {
			return nodeMapping[key].flow_type || "1" // 默认为开始节点
		}
	}
	return "1" // 默认为开始节点
}

/**
 * 获取节点版本
 * @param nodeType 节点类型
 * @returns 节点版本
 */
const getNodeVersion = (nodeType: string): string => {
	// 根据节点类型返回最新版本
	return "v0" // 默认版本
}

/**
 * 转换DSL边到Flow边
 * @param dslEdge DSL边
 * @param nodeTypeMap 节点ID到类型的映射
 * @returns Flow边
 */
const convertDSLEdge = (dslEdge: DSLEdge, nodeTypeMap: Record<string, string>): Edge => {
	return {
		id: dslEdge.id,
		source: dslEdge.source,
		target: dslEdge.target,
		sourceHandle: dslEdge.sourceHandle || undefined,
		type: "commonEdge",
		markerEnd: {
			type: "arrow",
			width: 20,
			height: 20,
			color: "#4d53e8",
		},
		style: {
			stroke: "#4d53e8",
			strokeWidth: 2,
		},
		data: {
			allowAddOnLine: true,
		},
		selected: dslEdge.selected || false,
	}
}

/**
 * 构建节点的下一个节点列表
 * @param nodeId 节点ID
 * @param edges 所有边
 * @param sourceHandleMap 节点分支映射表
 * @returns 下一个节点ID列表
 */
const buildNextNodes = (
	nodeId: string,
	edges: DSLEdge[],
	sourceHandleMap: Record<string, Record<string, string[]>>,
): string[] => {
	const nextNodes: string[] = []

	// 如果有特定分支的映射，则使用映射
	if (sourceHandleMap[nodeId]) {
		for (const handle in sourceHandleMap[nodeId]) {
			nextNodes.push(...sourceHandleMap[nodeId][handle])
		}
		return nextNodes
	}

	// 否则查找所有以该节点为source的边
	edges.forEach((edge) => {
		if (edge.source === nodeId && !nextNodes.includes(edge.target)) {
			nextNodes.push(edge.target)
		}
	})

	return nextNodes
}

/**
 * 构建分支映射表
 * @param edges 所有边
 * @returns 节点分支映射表 {nodeId: {sourceHandle: [targetId1, targetId2]}}
 */
const buildSourceHandleMap = (edges: DSLEdge[]): Record<string, Record<string, string[]>> => {
	const sourceHandleMap: Record<string, Record<string, string[]>> = {}

	edges.forEach((edge) => {
		if (edge.sourceHandle) {
			if (!sourceHandleMap[edge.source]) {
				sourceHandleMap[edge.source] = {}
			}
			if (!sourceHandleMap[edge.source][edge.sourceHandle]) {
				sourceHandleMap[edge.source][edge.sourceHandle] = []
			}
			sourceHandleMap[edge.source][edge.sourceHandle].push(edge.target)
		}
	})

	return sourceHandleMap
}

/**
 * 转换DSL节点参数到Flow节点参数
 * @param dslNode DSL节点
 * @param nodeType Flow节点类型
 * @returns Flow节点参数
 */
const convertDSLNodeParams = (dslNode: DSLNode, nodeType: string): any => {
	const params: any = {}

	// 根据不同节点类型处理不同参数
	switch (nodeType) {
		case customNodeType.Start:
			params.branches = [
				{
					branch_id: `branch_${uuidv4().replace(/-/g, "")}`,
					trigger_type: 1,
					next_nodes: [],
					config: null,
					input: null,
					output: {
						widget: null,
						form: {
							id: `component-${uuidv4().replace(/-/g, "")}`,
							version: "1",
							type: "form",
							structure: {
								type: "object",
								key: "root",
								sort: 0,
								title: "root节点",
								description: "",
								required: [],
								value: null,
								encryption: false,
								encryption_value: null,
								items: null,
								properties: {},
							},
						},
					},
				},
			]
			break

		case customNodeType.LLM:
			params.model = dslNode.data.model?.name || "gpt-3.5-turbo"
			params.system_prompt = ""
			params.user_prompt = ""

			// 处理提示词模板
			if (dslNode.data.prompt_template) {
				dslNode.data.prompt_template.forEach((template: any) => {
					if (template.role === "system") {
						params.system_prompt = template.text
					} else if (template.role === "user") {
						params.user_prompt = template.text
					}
				})
			}

			// 处理模型参数
			if (dslNode.data.model?.completion_params) {
				params.model_config = {
					temperature: dslNode.data.model.completion_params.temperature || 0.7,
					top_p: dslNode.data.model.completion_params.top_p || 1,
					presence_penalty: dslNode.data.model.completion_params.presence_penalty || 0,
					frequency_penalty: dslNode.data.model.completion_params.frequency_penalty || 0,
					max_tokens: dslNode.data.model.completion_params.max_tokens || 2000,
				}
			}
			break

		// 其他节点类型的处理...

		default:
			// 默认处理，保留原始数据结构
			for (const key in dslNode.data) {
				if (key !== "type" && key !== "desc") {
					params[key] = dslNode.data[key]
				}
			}
	}

	return params
}

/**
 * 转换DSL节点到Flow节点
 * @param dslNode DSL节点
 * @param nodeTypeMap 节点ID到类型的映射
 * @param sourceHandleMap 节点分支映射表
 * @param edges 所有边
 * @returns Flow节点
 */
const convertDSLNode = (
	dslNode: DSLNode,
	nodeTypeMap: Record<string, string>,
	sourceHandleMap: Record<string, Record<string, string[]>>,
	edges: DSLEdge[],
): Node => {
	const nodeType = nodeTypeMap[dslNode.id]
	const params = convertDSLNodeParams(dslNode, nodeType)

	return {
		id: dslNode.id,
		node_id: dslNode.id,
		node_type: nodeType,
		node_version: getNodeVersion(nodeType),
		name: dslNode.data.desc || "Unnamed Node",
		description: dslNode.data.desc || "",
		position: dslNode.position,
		params,
		meta: {},
		next_nodes: buildNextNodes(dslNode.id, edges, sourceHandleMap),
		step: 0,
		data: {},
		system_output: null,
	}
}

/**
 * 转换DSL到Flow的JSON格式
 * @param dslString DSL字符串 (YAML格式)
 * @returns Flow JSON对象
 */
export const dsl2json = (dslString: string): Flow => {
	try {
		// 解析YAML
		const dsl = yaml.load(dslString) as DSL

		// 创建节点类型映射
		const nodeTypeMap: Record<string, string> = {}
		dsl.workflow.graph.nodes.forEach((node) => {
			nodeTypeMap[node.id] = getNodeTypeByYamlType(node.data.type)
		})

		// 构建sourceHandle映射
		const sourceHandleMap = buildSourceHandleMap(dsl.workflow.graph.edges)

		// 转换边
		const edges = dsl.workflow.graph.edges.map((edge) => convertDSLEdge(edge, nodeTypeMap))

		// 转换节点
		const nodes = dsl.workflow.graph.nodes.map((node) =>
			convertDSLNode(node, nodeTypeMap, sourceHandleMap, dsl.workflow.graph.edges),
		)

		// 构建Flow JSON
		const flow: Flow = {
			id: `YAML-FLOW-${uuidv4().replace(/-/g, "")}-${Date.now().toString().slice(-8)}`,
			name: dsl.app.name,
			description: dsl.app.description || "",
			icon:
				dsl.app.icon ||
				"https://teamshareos-app-public.tos-cn-beijing.volces.com/YAML/713471849556451329/default/bot.png",
			type: dsl.app.mode === "workflow" ? 1 : 2,
			tool_set_id: "not_grouped",
			edges,
			nodes,
			global_variable: null,
			enabled: true,
			version_code: dsl.version || "",
			creator: "",
			created_at: new Date().toISOString().replace("T", " ").substring(0, 19),
			modifier: "",
			updated_at: new Date().toISOString().replace("T", " ").substring(0, 19),
			creator_info: null,
			modifier_info: null,
			user_operation: 1,
		}

		return flow
	} catch (error) {
		console.error("转换DSL到JSON失败:", error)
		throw new Error(
			`转换DSL到JSON失败: ${error instanceof Error ? error.message : String(error)}`,
		)
	}
}

/**
 * 从JSON字符串转换为Flow JSON对象
 * @param jsonString JSON字符串
 * @returns Flow JSON对象
 */
export const jsonStr2json = (jsonString: string): Flow => {
	try {
		return JSON.parse(jsonString) as Flow
	} catch (error) {
		console.error("解析JSON字符串失败:", error)
		throw new Error(
			`解析JSON字符串失败: ${error instanceof Error ? error.message : String(error)}`,
		)
	}
}

// #endregion

// #region JSON 转 DSL 相关函数

/**
 * 获取YAML节点类型
 * @param flowType Flow节点类型
 * @returns YAML节点类型
 */
const getYamlTypeByFlowType = (flowType: string): string => {
	for (const key in nodeMapping) {
		if (nodeMapping[key].flow_type === flowType) {
			return nodeMapping[key].yaml_type
		}
	}
	return "start" // 默认为开始节点
}

/**
 * 转换Flow边到DSL边
 * @param flowEdge Flow边
 * @param nodeTypeMap 节点ID到类型的映射
 * @returns DSL边
 */
const convertFlowEdge = (flowEdge: Edge, nodeTypeMap: Record<string, string>): DSLEdge => {
	// 确保源节点和目标节点的类型存在
	const sourceType = nodeTypeMap[flowEdge.source] || "start"
	const targetType = nodeTypeMap[flowEdge.target] || "end"

	return {
		data: {
			sourceType,
			targetType,
		},
		id: flowEdge.id,
		source: flowEdge.source,
		sourceHandle: flowEdge.sourceHandle || "source",
		target: flowEdge.target,
		targetHandle: "target",
		type: "custom",
		selected: flowEdge.selected || false,
	}
}

/**
 * 生成随机ID
 * @returns 字符串ID
 */
const generateId = (): string => {
	return Math.random().toString(36).substring(2, 15)
}

/**
 * 转换Flow节点参数到DSL节点数据
 * @param flowNode Flow节点
 * @param yamlType YAML节点类型
 * @returns DSL节点数据
 */
const convertFlowNodeData = (flowNode: Node, yamlType: string): any => {
	const data: any = {
		type: yamlType,
		desc: flowNode.name || "",
		selected: false,
	}

	// 根据不同节点类型处理不同参数
	switch (flowNode.node_type) {
		case customNodeType.LLM:
			data.model = {
				name: flowNode.params.model || "gpt-3.5-turbo",
				provider: "langgenius/openai/openai",
				mode: "chat",
				completion_params: {
					temperature: flowNode.params.model_config?.temperature || 0.7,
					top_p: flowNode.params.model_config?.top_p || 1,
					presence_penalty: flowNode.params.model_config?.presence_penalty || 0,
					frequency_penalty: flowNode.params.model_config?.frequency_penalty || 0,
					max_tokens: flowNode.params.model_config?.max_tokens || 2000,
				},
			}

			// 处理提示词模板
			data.prompt_template = []
			if (flowNode.params.system_prompt) {
				data.prompt_template.push({
					id: generateId(),
					role: "system",
					text: flowNode.params.system_prompt,
				})
			}
			if (flowNode.params.user_prompt) {
				data.prompt_template.push({
					id: generateId(),
					role: "user",
					text: flowNode.params.user_prompt,
				})
			}

			// 处理上下文和变量
			data.context = {
				enabled: false,
				variable_selector: [],
			}
			data.variables = []
			data.vision = {
				enabled: false,
			}
			break

		case customNodeType.If:
			data.cases = []
			data.conditions = []
			data.logical_operator = "and"

			if (flowNode.params.branches && Array.isArray(flowNode.params.branches)) {
				flowNode.params.branches.forEach((branch: any, index: number) => {
					if (branch.condition) {
						const condition = {
							id: generateId(),
							value: "",
							variable_selector: [],
							comparison_operator: "empty",
							logical_operator: "and",
						}
						data.conditions.push(condition)

						data.cases.push({
							case_id: branch.condition.value === true ? "true" : "false",
							conditions: [condition],
							logical_operator: "and",
						})
					}
				})
			}
			break

		// 其他节点类型的处理...

		default:
			// 默认处理，复制所有参数
			for (const key in flowNode.params) {
				if (key !== "branches" && key !== "next_nodes") {
					data[key] = flowNode.params[key]
				}
			}
	}

	return data
}

/**
 * 转换Flow节点到DSL节点
 * @param flowNode Flow节点
 * @returns DSL节点
 */
const convertFlowNode = (flowNode: Node): DSLNode => {
	const yamlType = getYamlTypeByFlowType(flowNode.node_type)
	const data = convertFlowNodeData(flowNode, yamlType)

	return {
		data,
		id: flowNode.id,
		position: flowNode.position,
		type: "custom",
		width: 244,
		height: flowNode.node_type === customNodeType.Start ? 194 : 118,
		dragging: false,
		selected: false,
		positionAbsolute: flowNode.position,
		sourcePosition: "right",
		targetPosition: "left",
	}
}

/**
 * 检测并生成依赖
 * @param flow Flow JSON
 * @returns 依赖数组
 */
const generateDependencies = (flow: Flow): any[] => {
	const dependencies: any[] = []
	const addedDependencies = new Set<string>()

	// 检查是否有LLM节点使用OpenAI
	flow.nodes.forEach((node) => {
		if (node.node_type === customNodeType.LLM) {
			// 添加OpenAI依赖
			if (!addedDependencies.has("openai")) {
				dependencies.push({
					current_identifier: null,
					type: "marketplace",
					value: {
						marketplace_plugin_unique_identifier:
							"langgenius/openai:0.0.7@11ec0b1909200f62b6ebf2cec1da981a9071d11c1ee0e2ef332ce89bcffa2544",
					},
				})
				addedDependencies.add("openai")
			}
		}

		// 检查是否有工具节点使用Google
		if (node.node_type === customNodeType.Tools && node.params.provider_id === "google") {
			// 添加Google依赖
			if (!addedDependencies.has("google")) {
				dependencies.push({
					current_identifier: null,
					type: "marketplace",
					value: {
						marketplace_plugin_unique_identifier:
							"langgenius/google:0.0.8@3efcf55ffeef9d0f77715e0afb23534952ae0cb385c051d0637e86d71199d1a6",
					},
				})
				addedDependencies.add("google")
			}
		}

		// 其他可能的依赖...
	})

	return dependencies
}

/**
 * 生成YAML的默认特性
 * @returns 特性对象
 */
const generateDefaultFeatures = (): any => {
	return {
		file_upload: {
			allowed_file_extensions: [".JPG", ".JPEG", ".PNG", ".GIF", ".WEBP", ".SVG"],
			allowed_file_types: ["image"],
			allowed_file_upload_methods: ["local_file", "remote_url"],
			enabled: false,
			fileUploadConfig: {
				audio_file_size_limit: 50,
				batch_count_limit: 5,
				file_size_limit: 15,
				image_file_size_limit: 10,
				video_file_size_limit: 100,
				workflow_file_upload_limit: 10,
			},
			image: {
				enabled: false,
				number_limits: 3,
				transfer_methods: ["local_file", "remote_url"],
			},
			number_limits: 3,
		},
		opening_statement: "",
		retriever_resource: {
			enabled: false,
		},
		sensitive_word_avoidance: {
			enabled: false,
		},
		speech_to_text: {
			enabled: false,
		},
		suggested_questions: [],
		suggested_questions_after_answer: {
			enabled: false,
		},
		text_to_speech: {
			enabled: false,
			language: "",
			voice: "",
		},
	}
}

/**
 * 转换Flow JSON到DSL
 * @param flow Flow JSON对象
 * @returns DSL对象
 */
export const json2dsl = (flow: Flow): DSL => {
	try {
		// 创建节点类型映射
		const nodeTypeMap: Record<string, string> = {}
		flow.nodes.forEach((node) => {
			const yamlType = getYamlTypeByFlowType(node.node_type)
			nodeTypeMap[node.id] = yamlType
		})

		// 转换节点
		const nodes = flow.nodes.map((node) => convertFlowNode(node))

		// 转换边
		const edges = flow.edges.map((edge) => convertFlowEdge(edge, nodeTypeMap))

		// 生成依赖
		const dependencies = generateDependencies(flow)

		// 构建DSL
		const dsl: DSL = {
			app: {
				name: flow.name,
				description: flow.description || "",
				icon: flow.icon && flow.icon.startsWith("http") ? "🤖" : flow.icon,
				icon_background: "#FFEAD5",
				mode: flow.type === 1 ? "workflow" : "chat",
				use_icon_as_answer_icon: false,
			},
			dependencies,
			kind: "app",
			version: flow.version_code || "0.1.0",
			workflow: {
				conversation_variables: [],
				environment_variables: [],
				features: generateDefaultFeatures(),
				graph: {
					edges,
					nodes,
					viewport: {
						x: 0,
						y: 0,
						zoom: 0.8,
					},
				},
			},
		}

		return dsl
	} catch (error) {
		console.error("转换JSON到DSL失败:", error)
		throw new Error(
			`转换JSON到DSL失败: ${error instanceof Error ? error.message : String(error)}`,
		)
	}
}

/**
 * 转换Flow JSON到DSL字符串 (YAML格式)
 * @param flow Flow JSON对象
 * @returns DSL字符串 (YAML格式)
 */
export const json2dslString = (flow: Flow): string => {
	try {
		const dsl = json2dsl(flow)
		return yaml.dump(dsl, { lineWidth: -1 })
	} catch (error) {
		console.error("转换JSON到DSL字符串失败:", error)
		throw new Error(
			`转换JSON到DSL字符串失败: ${error instanceof Error ? error.message : String(error)}`,
		)
	}
}

/**
 * 从JSON字符串转换为DSL字符串 (YAML格式)
 * @param jsonString JSON字符串
 * @returns DSL字符串 (YAML格式)
 */
export const jsonStr2dslString = (jsonString: string): string => {
	try {
		const flow = JSON.parse(jsonString) as Flow
		return json2dslString(flow)
	} catch (error) {
		console.error("转换JSON字符串到DSL字符串失败:", error)
		throw new Error(
			`转换JSON字符串到DSL字符串失败: ${
				error instanceof Error ? error.message : String(error)
			}`,
		)
	}
}

// #endregion
