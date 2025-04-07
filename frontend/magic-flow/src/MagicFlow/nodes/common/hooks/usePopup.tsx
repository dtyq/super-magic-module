/**
 * 处理节点类型下拉状态和行为
 */

import { useFlowInteraction } from "@/MagicFlow/components/FlowDesign/context/FlowInteraction/useFlowInteraction"
import { useFlow } from "@/MagicFlow/context/FlowContext/useFlow"
import { MagicFlow } from "@/MagicFlow/types/flow"
import { useMemoizedFn, useUpdateEffect } from "ahooks"
import { useEffect, useState } from "react"

type DropdownProps = {
	id: string
	currentNode: MagicFlow.Node
}

export default function usePopup({ id, currentNode }: DropdownProps) {
	const { selectedNodeId, setSelectedNodeId } = useFlow()

	const { isDragging } = useFlowInteraction()

	const [openPopup, setOpenPopup] = useState(false)

	const [nodeName, setNodeName] = useState(currentNode?.name as string)

	const onNodeWrapperClick = useMemoizedFn(() => {
		setOpenPopup(false)
	})

	const closePopup = useMemoizedFn(() => {
		setOpenPopup(false)
	})

	const onDropdownClick = useMemoizedFn((event) => {
		event.preventDefault()
		event.stopPropagation()

		setSelectedNodeId(id)
		setOpenPopup(true)
	})

	useUpdateEffect(() => {
		if (selectedNodeId !== id || isDragging) {
			setOpenPopup(false)
		}
	}, [selectedNodeId, isDragging])

	useEffect(() => {
		if (currentNode?.name) {
			setNodeName(currentNode?.name)
		}
	}, [currentNode?.name])

	return {
		openPopup,
		onNodeWrapperClick,
		onDropdownClick,
		nodeName,
		setOpenPopup,
		closePopup,
	}
}
