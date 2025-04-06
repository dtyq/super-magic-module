import { NodeSchema } from "@/MagicFlow/register/node"
import { MagicFlow } from "@/MagicFlow/types/flow"
import React from "react"
import { Edge, Node } from "reactflow"

export type FlowInteractionCtx = React.PropsWithChildren<{
	isDragging: boolean

	nodeClick: boolean

	resetLastLayoutData: () => void

	onAddItem: (
		event: any,
		nodeData: NodeSchema,
		extraConfig?: Record<string, any>,
	) => Promise<void>

	layout: () => MagicFlow.Node[]

	showParamsComp: boolean

	showSelectionTools: boolean
	setShowSelectionTools: React.Dispatch<React.SetStateAction<boolean>>

	onNodesDelete: (_nodes: Node[]) => void

	currentZoom: number

	reactFlowWrapper?: React.RefObject<HTMLDivElement>

	selectionNodes: MagicFlow.Node[]
	selectionEdges: Edge[]
}>

export const FlowInteractionContext = React.createContext({
	// 是否处于拖拽状态
	isDragging: false,

	nodeClick: false,

	// 重置布局
	resetLastLayoutData: () => {},

	// 新增节点
	onAddItem: (() => {}) as any,

	// 布局优化
	layout: () => [],

	// 是否显示组件的参数配置
	showParamsComp: true,

	/** 是否显示多选的选框的toolbar */
	showSelectionTools: false,
	setShowSelectionTools: () => {},

	onNodesDelete: () => {},

	currentZoom: 1,

	selectionNodes: [],
	selectionEdges: [],
} as FlowInteractionCtx)
