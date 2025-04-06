import { useFlow } from "@/MagicFlow/context/FlowContext/useFlow"
import { useNodes } from "@/MagicFlow/context/NodesContext/useNodes"
import { useUpdateEffect } from "ahooks"
import { useMemo } from "react"
import useViewport from "../../common/hooks/useViewport"
import { Interactions } from "../components/InteractionSelect"
import { MagicFlow } from "@/MagicFlow/types/flow"
import { Edge } from "reactflow"
import { NodeSchema } from "@/MagicFlow/register/node"
import { useExternal } from "@/MagicFlow/context/ExternalContext/useExternal"
import { omit } from "lodash"

type UseFlowCommandProps = {
	layout?: any
	onInteractionChange?: (updatedInteraction: Interactions) => void
	onFitView?: () => void
	onZoomIn?: () => void
	onZoomOut?: () => void
	onEdgeTypeChange?: (type: string) => void
	onLock?: () => void
	onNodesDelete?: (_nodes: (Node & Partial<MagicFlow.Node>)[]) => void
	onEdgesDelete?: (edges: Edge[]) => void
	onAddItem?: (
		event: any,
		nodeData: NodeSchema,
		extraConfig?: Record<string, any>,
	) => Promise<void>
}

export default function useFlowCommand({
	layout,
	onInteractionChange,
	onFitView,
	onZoomIn,
	onZoomOut,
	onEdgeTypeChange,
	onLock,
	onNodesDelete,
	onEdgesDelete,
	onAddItem,
}: UseFlowCommandProps) {
	const { updateViewPortToTargetNode } = useViewport()

	const {
		flow,
		deleteNodes,
		updateNodesPosition,
		updateNextNodeIdsByConnect,
		updateNextNodeIdsByDeleteEdge,
		setSelectedNodeId,
		edges,
		setEdges,
		selectedNodeId,
		nodeConfig,
		setNodeConfig,
		updateNodeConfig,
		addNode,
		selectedEdgeId,
		setSelectedEdgeId,
		description,
		onConnect,
	} = useFlow()

	const { flowInteractionRef, omitNodeKeys } = useExternal()

	const { nodes, setNodes } = useNodes()

	const flowCommands = useMemo(() => {
		return {
			flow,
			deleteNodes,
			updateNodesPosition,
			updateNextNodeIdsByConnect,
			updateNextNodeIdsByDeleteEdge,
			setSelectedNodeId,
			nodes,
			setNodes,
			edges,
			setEdges,
			selectedNodeId,
			nodeConfig,
			setNodeConfig,
			updateNodeConfig,
			addNode,
			selectedEdgeId,
			setSelectedEdgeId,
			updateViewPortToTargetNode,
			layout,
			onInteractionChange,
			onFitView,
			onZoomIn,
			onZoomOut,
			onEdgeTypeChange,
			onLock,
			onNodesDelete,
			onEdgesDelete,
			onAddItem,
			getFlow: () => {
				return {
					...flow,
					nodes: nodes.map((n) => {
						const node = nodeConfig?.[n.node_id] || {}
						const omitKeysNode = omit(node, omitNodeKeys)
						return omitKeysNode
					}),
					edges,
					description,
				}
			},
			onConnect,
		}
	}, [
		flow,
		deleteNodes,
		updateNodesPosition,
		updateNextNodeIdsByConnect,
		updateNextNodeIdsByDeleteEdge,
		setSelectedNodeId,
		nodes,
		setNodes,
		edges,
		setEdges,
		selectedNodeId,
		nodeConfig,
		setNodeConfig,
		updateNodeConfig,
		addNode,
		selectedEdgeId,
		setSelectedEdgeId,
		updateViewPortToTargetNode,
		layout,
		onInteractionChange,
		onFitView,
		onZoomIn,
		onZoomOut,
		onEdgeTypeChange,
		onLock,
		onNodesDelete,
		onEdgesDelete,
		onAddItem,
		onConnect,
		description,
		omitNodeKeys,
	])

	useUpdateEffect(() => {
		if (flowInteractionRef) {
			flowInteractionRef.current = flowCommands
		}
	}, [flowCommands])
}
