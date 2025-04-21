import { MagicFlow } from "@/MagicFlow/types/flow"
import React from "react"
import { Edge } from "reactflow"
import { EventEmitter } from "ahooks/lib/useEventEmitter"

// 拆分为多个专用的Context类型
// 流程数据相关
export type FlowDataCtx = {
    flow: MagicFlow.Flow | null
    description: string
    debuggerMode: boolean
    updateFlow: (this: any, flowConfig: any) => void
}

// 边相关
export type FlowEdgesCtx = {
    edges: Edge[]
    onEdgesChange: (this: any, changes: any) => void
    onConnect: (this: any, connection: any) => void
    setEdges: React.Dispatch<React.SetStateAction<Edge[]>>
    selectedEdgeId: string | null
    setSelectedEdgeId: React.Dispatch<React.SetStateAction<string | null>>
    updateNextNodeIdsByDeleteEdge: (connection: Edge) => void
    updateNextNodeIdsByConnect: (newEdge: Edge) => void
    deleteEdges: (edgesToDelete: Edge[]) => void
}

// 新增NodeConfigContext，用于管理节点配置数据
export type NodeConfigCtx = {
	// 节点配置
	nodeConfig: Record<string, any>
}

export const NodeConfigContext = React.createContext({
	nodeConfig: {},
} as NodeConfigCtx)

// 新增NodeConfigActionsContext存放所有操作方法
export type NodeConfigActionsCtx = {
	// 设置节点配置
	setNodeConfig: React.Dispatch<React.SetStateAction<Record<string, any>>>
	// 更新节点配置
	updateNodeConfig: (node: MagicFlow.Node, originalNode?: MagicFlow.Node) => void
	// 通知节点变化
	notifyNodeChange: (nodeId?: string) => void
}

export const NodeConfigActionsContext = React.createContext({
	setNodeConfig: () => {},
	updateNodeConfig: () => {},
	notifyNodeChange: () => {},
} as NodeConfigActionsCtx)

// 节点配置相关
export type FlowNodesCtx = {
    addNode: (node: MagicFlow.Node | MagicFlow.Node[], meta?: any) => void
    deleteNodes: (nodeIds: string[]) => void
    updateNodesPosition: (nodeId: string[], position: Record<string,{ x: number; y: number }>) => void
    selectedNodeId: string
    setSelectedNodeId: React.Dispatch<React.SetStateAction<string>>
    triggerNode: MagicFlow.Node
    getNewNodeIndex: () => number
}

// UI状态相关
export type FlowUICtx = {
    flowInstance: React.MutableRefObject<any>
    showMaterialPanel: boolean
    setShowMaterialPanel: React.Dispatch<React.SetStateAction<boolean>>
    flowDesignListener: EventEmitter<MagicFlow.FlowEventListener>
}

// 原始完整的Context类型
export type FlowCtx = React.PropsWithChildren<
    FlowDataCtx &
        FlowEdgesCtx &
        FlowNodesCtx &
        FlowUICtx &
        NodeConfigCtx &
        NodeConfigActionsCtx
>  

// 创建分离的Context
export const FlowDataContext = React.createContext<FlowDataCtx>({
    flow: null,
    description: "",
    debuggerMode: false,
    updateFlow: () => {},
})

export const FlowEdgesContext = React.createContext<FlowEdgesCtx>({
    edges: [] as Edge[],
    onEdgesChange: () => {},
    onConnect: () => {},
    setEdges: () => {},
    selectedEdgeId: null,
    setSelectedEdgeId: () => {},
    updateNextNodeIdsByDeleteEdge: () => {},
    updateNextNodeIdsByConnect: () => {},
    deleteEdges: () => {},
})

export const FlowNodesContext = React.createContext({
	addNode: () => {},
	deleteNodes: () => {},
	updateNodesPosition: () => {},
	selectedNodeId: "",
	setSelectedNodeId: () => {},
	triggerNode: null,
	getNewNodeIndex: () => 0,
} as FlowNodesCtx)

export const FlowUIContext = React.createContext<FlowUICtx>({
    flowInstance: null as any,
    showMaterialPanel: true,
    setShowMaterialPanel: () => {},
    flowDesignListener: {
        emit: () => {},
        useSubscription: () => {}
    } as any,
})

// 为了兼容性保留原始的FlowContext
export const FlowContext = React.createContext({} as FlowCtx)
