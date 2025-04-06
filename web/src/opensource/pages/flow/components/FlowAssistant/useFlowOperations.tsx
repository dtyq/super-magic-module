import { useRef } from "react"
import { message as antdMessage } from "antd"
import { useTranslation } from "react-i18next"
import { useMemoizedFn } from "ahooks"
import type { MagicFlow } from "@dtyq/magic-flow/MagicFlow/types/flow"
import { getLatestNodeVersion } from "@dtyq/magic-flow/MagicFlow/utils"
import { customNodeType } from "../../constants"

interface UseFlowOperationsProps {
	flowInteractionRef: React.MutableRefObject<any>
	saveDraft: () => Promise<void>
	flowService: any // 可以根据实际类型调整
}

export default function useFlowOperations({
	flowInteractionRef,
	saveDraft,
	flowService,
}: UseFlowOperationsProps) {
	const { t } = useTranslation()
	const commandExecutionRef = useRef<boolean>(false)

	// 定位到节点
	const goToNode = useMemoizedFn((nodeId: string) => {
		setTimeout(() => {
			if (!flowInteractionRef.current) return

			const node = flowInteractionRef.current.nodes?.find?.(
				(n: MagicFlow.Node) => n.node_id === nodeId,
			)
			if (node && node.width && node.height) {
				flowInteractionRef.current.updateViewPortToTargetNode(node)
			}
		}, 200)
	})

	// 添加节点
	const addNode = useMemoizedFn((nodeData: any) => {
		if (!flowInteractionRef.current) return false

		try {
			// 根据MagicFlowInstance的API实现添加节点
			const node: MagicFlow.Node = {
				id: nodeData.id || `node-${Date.now()}`,
				node_id: nodeData.node_id || `node-${Date.now()}`,
				node_type: nodeData.node_type || customNodeType.Start,
				node_version: getLatestNodeVersion(nodeData.node_type),
				params: nodeData.params || {},
				position: nodeData.position || { x: 100, y: 100 },
				meta: nodeData.meta || {},
				next_nodes: nodeData.next_nodes || [],
				step: nodeData.step || 0,
				data: nodeData.data || {},
				system_output: nodeData.system_output || null,
				output: nodeData.output || null,
			}

			flowInteractionRef.current.addNode(node)

			setTimeout(() => {
				// 有节点，自动定位到被连线的节点
				goToNode(node.node_id)
			}, 200)
			console.log("节点已添加:", nodeData)
			return true
		} catch (error) {
			console.error("添加节点失败:", error)
			antdMessage.error(t("flowAssistant.addNodeError", { ns: "flow" }))
			return false
		}
	})

	// 更新节点
	const updateNode = useMemoizedFn((nodeId: string, nodeData: any) => {
		if (!flowInteractionRef.current) return false

		try {
			if (nodeData.position) {
				// 更新节点位置
				flowInteractionRef.current.updateNodesPosition([nodeId], nodeData.position)
			}

			// 更新节点配置
			const { nodeConfig } = flowInteractionRef.current || {}
			const currentNode = nodeConfig[nodeId]

			goToNode(nodeId)

			if (currentNode) {
				flowInteractionRef.current.updateNodeConfig({
					...{ ...currentNode, ...nodeData },
					params: { ...(currentNode.params || {}), ...(nodeData.params || {}) },
					// 更新其他属性
				})
			}

			console.log("节点已更新:", nodeId, nodeData)
			return true
		} catch (error) {
			console.error("更新节点失败:", error)
			antdMessage.error(t("flowAssistant.updateNodeError", { ns: "flow" }))
			return false
		}
	})

	// 删除节点
	const deleteNode = useMemoizedFn((nodeId: string) => {
		if (!flowInteractionRef.current) return false

		try {
			flowInteractionRef.current.deleteNodes([nodeId])
			console.log("节点已删除:", nodeId)
			return true
		} catch (error) {
			console.error("删除节点失败:", error)
			antdMessage.error(t("flowAssistant.deleteNodeError", { ns: "flow" }))
			return false
		}
	})

	// 连接节点
	const connectNodes = useMemoizedFn(
		(sourceNodeId: string, targetNodeId: string, sourceHandleId: string) => {
			if (!flowInteractionRef.current) return false

			try {
				flowInteractionRef.current.onConnect({
					source: sourceNodeId,
					target: targetNodeId,
					sourceHandle: sourceHandleId,
				})
				goToNode(targetNodeId)
				console.log("节点已连接:", sourceNodeId, "->", targetNodeId)
				return true
			} catch (error) {
				console.error("连接节点失败:", error)
				antdMessage.error(t("flowAssistant.connectNodesError", { ns: "flow" }))
				return false
			}
		},
	)

	// 断开节点连接
	const disconnectNodes = useMemoizedFn((sourceNodeId: string, targetNodeId: string) => {
		if (!flowInteractionRef.current) return false

		try {
			// 获取当前源节点的下一个节点列表
			const currentFlow = flowInteractionRef.current.getFlow()
			const sourceNode = currentFlow.nodes?.find(
				(node: MagicFlow.Node) => node.id === sourceNodeId,
			)
			const nextNodeIds = (sourceNode?.next_nodes || []).filter(
				(id: string) => id !== targetNodeId,
			)

			// 更新连接
			flowInteractionRef.current.updateNextNodeIdsByDeleteEdge(sourceNodeId, nextNodeIds)
			console.log("节点连接已断开:", sourceNodeId, "->", targetNodeId)
			return true
		} catch (error) {
			console.error("断开节点连接失败:", error)
			antdMessage.error(t("flowAssistant.disconnectNodesError", { ns: "flow" }))
			return false
		}
	})

	// 发布流程
	const publishFlow = useMemoizedFn(async (publishData: any, flowId: string) => {
		if (!flowInteractionRef.current) return false

		const currentFlow = flowInteractionRef.current.getFlow()
		if (!currentFlow) return false

		try {
			await flowService.publishFlow(
				{
					name: publishData.name || currentFlow.name,
					description: publishData.description || currentFlow.description,
					magic_flow: currentFlow,
				},
				flowId,
			)

			antdMessage.success(t("flowAssistant.publishSuccess", { ns: "flow" }))
			return true
		} catch (error) {
			console.error("Error publishing flow:", error)
			antdMessage.error(t("flowAssistant.publishError", { ns: "flow" }))
			return false
		}
	})

	// 执行流程操作命令
	const executeOperations = useMemoizedFn(async (operations: any[], flowId: string) => {
		if (!flowInteractionRef.current) return []

		const results = []
		// 避免在循环中使用await，顺序处理所有操作
		for (let i = 0; i < operations.length; i += 1) {
			const operation = operations[i]
			try {
				let result
				switch (operation.type) {
					case "addNode":
						result = addNode(operation.nodeData)
						break
					case "updateNode":
						result = updateNode(operation.nodeId, operation.nodeData)
						break
					case "deleteNode":
						result = deleteNode(operation.nodeId)
						break
					case "connectNodes":
						result = connectNodes(
							operation.sourceNodeId,
							operation.targetNodeId,
							operation.sourceHandleId,
						)
						break
					case "disconnectNodes":
						result = disconnectNodes(operation.sourceNodeId, operation.targetNodeId)
						break
					case "saveDraft":
						// 只在saveDraft和publishFlow中使用await，这是必要的异步操作
						// eslint-disable-next-line no-await-in-loop
						result = await saveDraft()
						break
					case "publishFlow":
						// eslint-disable-next-line no-await-in-loop
						result = await publishFlow(operation.publishData, flowId)
						break
					default:
						console.warn("Unknown operation type:", operation.type)
						result = false
				}
				results.push({
					type: operation.type,
					success: !!result,
				})
			} catch (error) {
				console.error(`Error executing operation ${operation.type}:`, error)
				results.push({
					type: operation.type,
					success: false,
					error,
				})
			}
		}
		return results
	})

	return {
		addNode,
		updateNode,
		deleteNode,
		connectNodes,
		disconnectNodes,
		publishFlow,
		executeOperations,
		commandExecutionRef,
	}
}
