import { useCurrentNode } from "@dtyq/magic-flow/MagicFlow/nodes/common/context/CurrentNode/useCurrentNode"
import { useMemo } from "react"
import { getNodeVersion } from "@dtyq/magic-flow/MagicFlow/utils"
import { get } from "lodash-es"
import type { customNodeType } from "../../constants"
import { templateMap } from "../../constants"

type InitialValueProps = {
	nodeType: customNodeType
}

export default function useInitialValue({ nodeType }: InitialValueProps) {
	const { currentNode } = useCurrentNode()

	const initialValues = useMemo(() => {
		if (!currentNode) return null
		const nodeVersion = getNodeVersion(currentNode)
		const params = get(templateMap, [nodeType, nodeVersion, "params"], {})
		return {
			...params,
			...currentNode?.params,
		}
	}, [currentNode, nodeType])

	return {
		initialValues,
	}
}
