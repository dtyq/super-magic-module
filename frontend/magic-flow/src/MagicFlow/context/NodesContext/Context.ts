import { MagicFlow } from "@/MagicFlow/types/flow"
import React from "react"

export type NodesCtx = React.PropsWithChildren<{
    // 节点数据
    nodes: MagicFlow.Node[]
    setNodes: React.Dispatch<React.SetStateAction<MagicFlow.Node[]>>
    onNodesChange: (this: any, changes: any) => void
}>  

export const NodesContext = React.createContext({
    // 节点数据
    nodes: [] as MagicFlow.Node[],
    setNodes: () => {},
    onNodesChange: () => {},
} as NodesCtx) 