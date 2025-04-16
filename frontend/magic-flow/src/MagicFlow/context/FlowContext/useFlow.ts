import React, { useContext } from "react"
import { 
	FlowContext, 
	FlowDataContext, 
	FlowEdgesContext, 
	FlowNodesContext, 
	FlowUIContext,
	NodeConfigContext,
	NodeConfigActionsContext,
} from "./Context"

// 原有hook保持不变，为了向后兼容
export const useFlow = () => useContext(FlowContext)

// 新增专用hook，让组件可以只订阅它们需要的数据
export const useFlowData = () => useContext(FlowDataContext)

export const useFlowEdges = () => useContext(FlowEdgesContext)

export const useFlowNodes = () => useContext(FlowNodesContext)

export const useFlowUI = () => useContext(FlowUIContext)

// 只获取节点配置数据
export const useNodeConfig = () => useContext(NodeConfigContext)

// 获取节点配置操作方法
export const useNodeConfigActions = () => useContext(NodeConfigActionsContext)

// 获取单个节点配置，优化渲染性能
export const useSingleNodeConfig = (nodeId: string) => {
	const { nodeConfig } = useContext(NodeConfigContext)
	return nodeConfig[nodeId]
}

// 创建特定数据选择器，可以进一步减少不必要的渲染
export function createFlowSelector<T>(selector: (context: any) => T) {
	return function useFlowSelector() {
		const context = React.useContext(FlowContext)
		return React.useMemo(() => selector(context), [context])
	}
}

// 创建节点配置选择器，只有当特定节点配置改变时才会重新渲染
export function createNodeConfigSelector(nodeId: string) {
	return () => {
		const { nodeConfig } = useNodeConfig()
		return nodeConfig[nodeId]
	}
}

// 针对具体字段的选择器示例
export const useSelectedNodeId = () => {
	const { selectedNodeId, setSelectedNodeId } = useFlowNodes()
	return { selectedNodeId, setSelectedNodeId }
}

export const useSelectedEdgeId = () => {
	const { selectedEdgeId, setSelectedEdgeId } = useFlowEdges()
	return { selectedEdgeId, setSelectedEdgeId }
}

export const useNodeOperations = () => {
	const { addNode, deleteNodes, updateNodesPosition } = useFlowNodes()
	return { addNode, deleteNodes, updateNodesPosition }
}

export const useMaterialPanel = () => {
	const { showMaterialPanel, setShowMaterialPanel } = useFlowUI()
	return { showMaterialPanel, setShowMaterialPanel }
}
