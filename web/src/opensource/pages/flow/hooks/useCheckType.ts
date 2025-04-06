/**
 * 检查当前流程还是Agent
 */

import { useMemo } from "react"
import { useParams } from "react-router"
import { MAGIC_FLOW_ID_PREFIX } from "../constants"

export default function useCheckType() {
	const { id } = useParams()
	const agentId = id as string

	const isAgent = useMemo(() => {
		// 暂时通过id的前缀进行判断
		return !agentId.startsWith(MAGIC_FLOW_ID_PREFIX)
	}, [agentId])

	return {
		isAgent,
	}
}
