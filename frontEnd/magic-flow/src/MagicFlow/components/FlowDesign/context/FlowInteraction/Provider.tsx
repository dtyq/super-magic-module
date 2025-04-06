import React, { useMemo } from "react"
import { FlowInteractionContext, FlowInteractionCtx } from "./Context"

export const FlowInteractionProvider = ({
	isDragging,
	nodeClick,
	resetLastLayoutData,
	onAddItem,
	layout,
	showParamsComp,
	showSelectionTools,
	setShowSelectionTools,
	onNodesDelete,
	currentZoom,
	reactFlowWrapper,
	selectionNodes,
	selectionEdges,
	children,
}: FlowInteractionCtx) => {
	const value = useMemo(() => {
		return {
			isDragging,
			nodeClick,
			resetLastLayoutData,
			onAddItem,
			layout,
			showParamsComp,
			showSelectionTools,
			setShowSelectionTools,
			onNodesDelete,
			currentZoom,
			reactFlowWrapper,
			selectionNodes,
			selectionEdges,
		}
	}, [
		isDragging,
		nodeClick,
		resetLastLayoutData,
		onAddItem,
		layout,
		showParamsComp,
		showSelectionTools,
		setShowSelectionTools,
		onNodesDelete,
		currentZoom,
		reactFlowWrapper,
		selectionNodes,
		selectionEdges,
	])

	return (
		<FlowInteractionContext.Provider value={value}>{children}</FlowInteractionContext.Provider>
	)
}
