import useHeaderRight from "@/opensource/pages/flow/common/hooks/useHeaderRight"
import { useMemo } from "react"

export default function DocumentResolveHeaderRightV0() {
	const rules = useMemo(() => {
		return []
	}, [])

	const { HeaderRight } = useHeaderRight({ rules })

	return HeaderRight
}
