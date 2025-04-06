import useHeaderRight from "@/opensource/pages/flow/common/hooks/useHeaderRight"
import { useMemo } from "react"

export default function RecordOperationHeaderRightV0() {
	const rules = useMemo(() => {
		return [
			{
				type: "expression",
				paramsType: "list",
				path: ["params", "filters"],
				subKeys: ["value", "structure"],
			},
			{
				type: "expression",
				paramsType: "object",
				path: ["params", "columns"],
				subKeys: ["structure"],
			},
		]
	}, [])

	const { HeaderRight } = useHeaderRight({ rules })

	return HeaderRight
}
