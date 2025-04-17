import React, { useMemo } from "react"
import {
	FlowContext,
	FlowCtx,
	FlowDataContext,
	FlowEdgesContext,
	FlowNodesContext,
	FlowUIContext,
} from "./Context"

export const FlowProvider = ({
	flow,
	edges,
	onEdgesChange,
	onConnect,
	updateFlow,
	nodeConfig,
	setNodeConfig,
	updateNodeConfig,
	addNode,
	deleteNodes,
	deleteEdges,
	updateNodesPosition,
	selectedNodeId,
	setSelectedNodeId,
	triggerNode,
	selectedEdgeId,
	setSelectedEdgeId,
	setEdges,
	updateNextNodeIdsByDeleteEdge,
	updateNextNodeIdsByConnect,
	description,
	flowInstance,
	debuggerMode,
	getNewNodeIndex,
	showMaterialPanel,
	setShowMaterialPanel,
	flowDesignListener,
	notifyNodeChange,
	children,
}: FlowCtx) => {
	// 将数据分组到不同的context
	const flowDataValue = useMemo(() => {
		return {
			flow,
			description,
			debuggerMode,
			updateFlow,
		}
	}, [flow, description, debuggerMode, updateFlow])

	const flowEdgesValue = useMemo(() => {
		return {
			edges,
			onEdgesChange,
			onConnect,
			setEdges,
			selectedEdgeId,
			setSelectedEdgeId,
			updateNextNodeIdsByDeleteEdge,
			updateNextNodeIdsByConnect,
			deleteEdges,
		}
	}, [
		edges,
		onEdgesChange,
		onConnect,
		setEdges,
		selectedEdgeId,
		setSelectedEdgeId,
		updateNextNodeIdsByDeleteEdge,
		updateNextNodeIdsByConnect,
		deleteEdges,
	])

	const flowNodesValue = useMemo(() => {
		return {
			nodeConfig,
			setNodeConfig,
			updateNodeConfig,
			addNode,
			deleteNodes,
			updateNodesPosition,
			selectedNodeId,
			setSelectedNodeId,
			triggerNode,
			getNewNodeIndex,
			notifyNodeChange,
		}
	}, [
		nodeConfig,
		setNodeConfig,
		updateNodeConfig,
		addNode,
		deleteNodes,
		updateNodesPosition,
		selectedNodeId,
		setSelectedNodeId,
		triggerNode,
		getNewNodeIndex,
		notifyNodeChange,
	])

	const flowUIValue = useMemo(() => {
		return {
			flowInstance,
			showMaterialPanel,
			setShowMaterialPanel,
			flowDesignListener,
		}
	}, [flowInstance, showMaterialPanel, setShowMaterialPanel, flowDesignListener])

	// 为了向后兼容，保留整体的FlowContext
	const fullValue = useMemo(() => {
		return {
			...flowDataValue,
			...flowEdgesValue,
			...flowNodesValue,
			...flowUIValue,
		}
	}, [flowDataValue, flowEdgesValue, flowNodesValue, flowUIValue])

	return (
		<FlowDataContext.Provider value={flowDataValue}>
			<FlowEdgesContext.Provider value={flowEdgesValue}>
				<FlowNodesContext.Provider value={flowNodesValue}>
					<FlowUIContext.Provider value={flowUIValue}>
						<FlowContext.Provider value={fullValue}>{children}</FlowContext.Provider>
					</FlowUIContext.Provider>
				</FlowNodesContext.Provider>
			</FlowEdgesContext.Provider>
		</FlowDataContext.Provider>
	)
}
