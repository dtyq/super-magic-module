/**
 * 定义节点的相关drag-over、drag-leave事件
 */
import { useFlowInteraction } from "@/MagicFlow/components/FlowDesign/context/FlowInteraction/useFlowInteraction"
import { useExternal } from "@/MagicFlow/context/ExternalContext/useExternal"
import { useFlow } from "@/MagicFlow/context/FlowContext/useFlow"
import { judgeIsLoopBody } from "@/MagicFlow/utils"
import { getSubNodePosition } from "@/MagicFlow/utils/reactflowUtils"
import { useMemoizedFn } from "ahooks"
import { useMemo } from "react"
import { useReactFlow } from "reactflow"

type UseDrag = {
	id: string
}

export default function useDrag({ id }: UseDrag) {
	const { setSelectedNodeId, nodeConfig } = useFlow()
	const { paramsName } = useExternal()
	const { onAddItem } = useFlowInteraction()
	const { screenToFlowPosition } = useReactFlow()

	const currentNode = useMemo(() => {
		return nodeConfig[id]
	}, [nodeConfig, id])

	const isGroupType = useMemo(() => {
		return judgeIsLoopBody(currentNode?.[paramsName.nodeType])
	}, [currentNode])

	const onDragOver = useMemoizedFn(() => {
		/** 当前是节点是分组节点，则选中分组 */
		if (isGroupType) {
			setSelectedNodeId(id)
			return
		}
		/** 当前节点 */
		if (currentNode?.parentId) {
			setSelectedNodeId(currentNode?.parentId)
		}
	})

	const onDragLeave = useMemoizedFn(() => {
		if (isGroupType || currentNode?.parentId) {
			setSelectedNodeId(null)
		}
	})

	/** 新增分组的子节点 */
	const addChildNode = useMemoizedFn((event, pid) => {
		event.stopPropagation()
		const jsonString = event.dataTransfer.getData("node-data")
		const parentNode = nodeConfig?.[pid]

		const position = getSubNodePosition(event, screenToFlowPosition, parentNode)

		if (jsonString) {
			const nodeSchema = JSON.parse(jsonString)
			onAddItem(event, nodeSchema, {
				parentId: pid,
				expandParent: true,
				extent: "parent",
				meta: {
					position,
					parent_id: pid,
				},
			})
		}
	})

	const onDrop = useMemoizedFn((event) => {
		if (isGroupType) {
			addChildNode(event, id)
			return
		}
		if (currentNode?.parentId) {
			addChildNode(event, currentNode?.parentId)
		}
	})

	return {
		onDragOver,
		onDragLeave,
		onDrop,
	}
}
