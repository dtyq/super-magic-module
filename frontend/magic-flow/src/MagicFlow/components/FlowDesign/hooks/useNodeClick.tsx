import { useExternal } from "@/MagicFlow/context/ExternalContext/useExternal"
import { useFlow } from "@/MagicFlow/context/FlowContext/useFlow"
import { judgeIsLoopBody } from "@/MagicFlow/utils"
import { useMemoizedFn } from "ahooks"
import { useState } from "react"
import useLoopBodyClick from "./useLoopBodyClick"

export default function useNodeClick() {
	const { setSelectedNodeId } = useFlow()

	const { paramsName } = useExternal()

	const [nodeClick, setNodeClick] = useState(false)

	const { elevateBodyEdgesLevel, resetEdgesLevels } = useLoopBodyClick()

	const onNodeClick = useMemoizedFn((event, node) => {
		// console.log("NODE", node)
		event.stopPropagation()
		setSelectedNodeId(node.id)
		setNodeClick(!nodeClick)

		// 处理点击循环体的逻辑
		if (judgeIsLoopBody(node[paramsName.nodeType])) {
			// 需要手动提升循环体内边的层级
			elevateBodyEdgesLevel(node)
		} else {
			resetEdgesLevels(node)
		}
	})

	const onPanelClick = useMemoizedFn(() => {
		setNodeClick(!nodeClick)
	})

	return {
		nodeClick,
		onNodeClick,
		onPanelClick,
	}
}
