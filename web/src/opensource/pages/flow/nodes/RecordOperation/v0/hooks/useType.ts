/**
 * 根据字段类型不同，返回不同的条件
 */

import { useMemo } from "react"
import type { RecordType } from ".."

type TypeProps = {
	type: RecordType
}

export default function useType({ type }: TypeProps) {
	// 是否需要配置筛选
	const hasFilter = useMemo(() => {
		return type === "update" || type === "delete" || type === "search"
	}, [type])

	// 是否需要配置字段
	const hasColumns = useMemo(() => {
		return type === "update" || type === "add"
	}, [type])

	return {
		hasFilter,
		hasColumns,
	}
}
