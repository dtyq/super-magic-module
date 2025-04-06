import useHeaderRight from "@/opensource/pages/flow/common/hooks/useHeaderRight"
import { useMemo } from "react"

export default function LLMCallHeaderRightV0() {
	const rules = useMemo(() => {
		return [
			{
				type: "expression",
				path: ["params", "system_prompt", "structure"],
			},
			{
				type: "expression",
				path: ["params", "user_prompt", "structure"],
			},
			{
				type: "expression",
				path: ["params", "model", "structure"],
			},

			{
				type: "schema",
				path: ["params", "messages", "structure"],
			},
		]
	}, [])

	const { HeaderRight } = useHeaderRight({ rules })

	return HeaderRight
}
