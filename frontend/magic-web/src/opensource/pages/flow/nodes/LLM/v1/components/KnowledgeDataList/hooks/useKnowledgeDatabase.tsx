/**
 * 天书知识库数据源hooks
 */

import type { Knowledge } from "@/types/knowledge"
import { useCurrentNode } from "@dtyq/magic-flow/MagicFlow/nodes/common/context/CurrentNode/useCurrentNode"
import { useMemo } from "react"
import RenderLabel from "../../KnowledgeDatabaseSelect/RenderLabel"
import { useFlowStore } from "@/opensource/stores/flow"

export default function useKnowledgeDatabases() {
	const { useableTeamshareDatabase } = useFlowStore()

	const { currentNode } = useCurrentNode()

	const teamshareDatabaseOptions = useMemo(() => {
		return useableTeamshareDatabase.map((item) => {
			const hasSelected = currentNode?.params?.knowledge_list?.find?.(
				(knowledge: Knowledge.KnowledgeDatabaseItem) =>
					knowledge?.business_id === item.business_id,
			)
			return {
				label: <RenderLabel item={item} />,
				value: item.business_id,
				disabled: !!hasSelected,
			}
		})
	}, [currentNode, useableTeamshareDatabase])

	return {
		teamshareDatabaseOptions,
	}
}
