import React, { memo } from "react"
import ReactFlow, { SelectionMode } from "reactflow"
import { ConnectionLine } from "@/MagicFlow/edges/ConnectionLine"
import { Interactions } from "../../components/InteractionSelect"

interface ReactFlowComponentProps {
	nodeTypes: any
	edgeTypes: any
	nodes: any[]
	edges: any[]
	onNodesChange: any
	onEdgesChange: any
	onConnect: any
	onNodeClick: any
	onEdgeClick: any
	onNodeDragStart: any
	onNodeDrag: any
	onNodeDragStop: any
	onDrop: any
	onDragOver: any
	onClick: any
	onNodesDelete: any
	onEdgesDelete: any
	onPaneClick: any
	onMove: any
	onSelectionChange: any
	onSelectionEnd: any
	interaction: string
	flowInstance: any
	onlyRenderVisibleElements: boolean
	children: React.ReactNode
}

const ReactFlowComponent = memo(
	({
		nodeTypes,
		edgeTypes,
		nodes,
		edges,
		onNodesChange,
		onEdgesChange,
		onConnect,
		onNodeClick,
		onEdgeClick,
		onNodeDragStart,
		onNodeDrag,
		onNodeDragStop,
		onDrop,
		onDragOver,
		onClick,
		onNodesDelete,
		onEdgesDelete,
		onPaneClick,
		onMove,
		onSelectionChange,
		onSelectionEnd,
		interaction,
		flowInstance,
		children,
	}: ReactFlowComponentProps) => {
		return (
			<ReactFlow
				//@ts-ignore
				nodeTypes={nodeTypes}
				edgeTypes={edgeTypes}
				//@ts-ignore
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				onNodeClick={onNodeClick}
				onEdgeClick={onEdgeClick}
				onNodeDragStart={onNodeDragStart}
				onNodeDrag={onNodeDrag}
				onNodeDragStop={onNodeDragStop}
				onDrop={onDrop}
				onDragOver={onDragOver}
				onClick={onClick}
				onNodesDelete={onNodesDelete}
				onEdgesDelete={onEdgesDelete}
				minZoom={0.01}
				maxZoom={8}
				connectionLineComponent={ConnectionLine}
				panOnScroll={interaction === Interactions.TouchPad}
				zoomOnScroll={interaction === Interactions.Mouse}
				panOnDrag={interaction === Interactions.Mouse}
				selectionOnDrag
				ref={flowInstance}
				onPaneClick={onPaneClick}
				zoomOnDoubleClick={false}
				// @ts-ignore
				onMove={onMove}
				selectionKeyCode={null}
				onSelectionChange={onSelectionChange}
				onSelectionEnd={onSelectionEnd}
				// 选中部分就算选中
				selectionMode={SelectionMode.Partial}
			>
				{children}
			</ReactFlow>
		)
	},
)

export default ReactFlowComponent
