import useHeaderRight from "@/opensource/pages/flow/common/hooks/useHeaderRight"
import { useMemo } from "react"

export default function KnowledgeSearchHeaderRightV0() {
	const rules = useMemo(() => {
		return [
			{
				type: "expression",
				path: ["params", "query", "structure"],
			},
		]
	}, [])

	const { HeaderRight } = useHeaderRight({ rules })

	return HeaderRight
}
