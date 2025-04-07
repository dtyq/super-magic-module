import React, { useMemo } from "react"
import { NodesContext, NodesCtx } from "./Context"

export const NodesProvider = ({ nodes, setNodes, onNodesChange, children }: NodesCtx) => {
	const value = useMemo(() => {
		return {
			nodes,
			setNodes,
			onNodesChange,
		}
	}, [nodes, setNodes, onNodesChange])

	return <NodesContext.Provider value={value}>{children}</NodesContext.Provider>
}
