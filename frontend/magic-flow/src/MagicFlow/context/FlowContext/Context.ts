import { DebouncedFunc } from "lodash"
import { MagicFlow } from "@/MagicFlow/types/flow"
import React from "react"
import { Edge, ReactFlowInstance } from "reactflow"
import { EventEmitter } from "ahooks/lib/useEventEmitter"

export type FlowCtx = React.PropsWithChildren<{
	// 流程数据
    flow: MagicFlow.Flow | null
    edges: Edge[]
	onEdgesChange: (this: any, changes: any) => void
	onConnect: (this: any, connection: any) => void
	setEdges: React.Dispatch<React.SetStateAction<Edge[]>>
	updateFlow: (this: any, flowConfig: any) => void
	
	// 节点配置
    nodeConfig: Record<string, MagicFlow.Node>
    setNodeConfig: React.Dispatch<React.SetStateAction<Record<string, MagicFlow.Node>>>
    updateNodeConfig: (node: MagicFlow.Node, originalNode?: MagicFlow.Node) => void
    
    // 节点操作
    addNode: (newNode: MagicFlow.Node | MagicFlow.Node[], newEdges?: Edge[]) => void
    deleteNodes: (ids: string[]) => void
    deleteEdges: (edgesToDelete: Edge[]) => void
    updateNodesPosition: DebouncedFunc<(nodeIds: any, positionMap: any) => void>
    
    // 节点选择
    selectedNodeId: string | null
    setSelectedNodeId: React.Dispatch<React.SetStateAction<string | null>>
	
	triggerNode: MagicFlow.Node | null
	selectedEdgeId: string | null
	setSelectedEdgeId: React.Dispatch<React.SetStateAction<string | null>>
	updateNextNodeIdsByDeleteEdge: (connection: Edge) => void
	updateNextNodeIdsByConnect: (newEdge: Edge) => void
	description: string
	flowInstance: React.MutableRefObject<any>
	debuggerMode: boolean
	
	// 节点索引
    getNewNodeIndex: () => number
	
	showMaterialPanel: boolean,
	setShowMaterialPanel: React.Dispatch<React.SetStateAction<boolean>>
	flowDesignListener: EventEmitter<MagicFlow.FlowEventListener>
	
	// 节点变更通知
    notifyNodeChange?: () => void
}>  

export const FlowContext = React.createContext({
	// 当前流程详情
	flow: null,

	// 流程数据
	edges: [] as Edge[],
	onEdgesChange: () => {},
	onConnect: () => {},
	setEdges: () => {},

	// 更新流程
	updateFlow: () => {},
	
	// 节点配置
    nodeConfig: {} as Record<string, MagicFlow.Node>,
    setNodeConfig: () => {},
    updateNodeConfig: () => {},
    
    // 节点操作
    addNode: () => Promise.resolve(),
    deleteNodes: () => {},
    deleteEdges: () => {},
    updateNodesPosition: (() => {}) as any,
    
    // 节点选择
    selectedNodeId: null as string | null,
    setSelectedNodeId: () => {},

	// 触发节点
	triggerNode: null,

	// 当前选中id
	selectedEdgeId: null,
	setSelectedEdgeId: () => {},

	// 删除分支时nextNodeIds的更新函数
	updateNextNodeIdsByDeleteEdge: () => {},

	// 新增边时nextNodes的更新函数
	updateNextNodeIdsByConnect: () => {},

	// computed的流程描述信息
	description: "",

	// 画布实例
	flowInstance: null as any,

	// 是否处于调试模式
	debuggerMode: false,
	
	// 获取当前新节点的序号
    getNewNodeIndex: () => 0,

	// 是否显示物料面板
	showMaterialPanel: true,
	setShowMaterialPanel: () => {},

	// 流程事件监听器
	flowDesignListener: {
		emit: () => {},
		useSubscription: () => {}
	} as any,
	
	// 通知更新函数（没有走updateNodeConfig触发更新时需要使用）
    notifyNodeChange: () => {},

} as FlowCtx)
