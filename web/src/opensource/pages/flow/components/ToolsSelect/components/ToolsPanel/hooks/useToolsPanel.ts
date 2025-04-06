/**
 * 工具集面板选择相关数据及行为管理
 */

import { useFlowStore } from "@/opensource/stores/flow"
import type { UseableToolSet } from "@/types/flow"
import { useResetState, useUpdateEffect } from "ahooks"
import { useEffect, useState } from "react"

type UseToolPanelProps = {
	open: boolean
}

export default function useToolsPanel({ open }: UseToolPanelProps) {
	const [filteredUseableToolSets, setFilteredUseableToolSets] = useResetState(
		[] as UseableToolSet.Item[],
	)

	const [keyword, setKeyword] = useState("")

	const { useableToolSets } = useFlowStore()

	useEffect(() => {
		setFilteredUseableToolSets(useableToolSets)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [useableToolSets, open])

	useUpdateEffect(() => {
		const filterResult = useableToolSets
			.map((useableToolSet) => {
				const filterTools = useableToolSet?.tools?.filter(
					(tool) =>
						tool?.name?.includes?.(keyword) || tool?.description?.includes?.(keyword),
				)
				if (filterTools.length > 0) {
					return {
						...useableToolSet,
						tools: filterTools,
					}
				}
				return null
			})
			.filter((t) => !!t) as UseableToolSet.Item[]
		setFilteredUseableToolSets(filterResult)
	}, [keyword])

	return {
		useableToolSets,
		filteredUseableToolSets,
		keyword,
		setKeyword,
	}
}
