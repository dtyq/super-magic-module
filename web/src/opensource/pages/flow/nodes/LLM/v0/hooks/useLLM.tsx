import { useMemo } from "react"
import { useCurrentNode } from "@dtyq/magic-flow/MagicFlow/nodes/common/context/CurrentNode/useCurrentNode"
import { customNodeType, templateMap } from "@/opensource/pages/flow/constants"
import { cloneDeep, isNull } from "lodash-es"
import useOldToolsHandle from "./useOldToolsHandle"

export default function useLLMV0() {
	const { currentNode } = useCurrentNode()

	const { handleOldTools } = useOldToolsHandle()

	const initialValues = useMemo(() => {
		let nodeParams = {
			...cloneDeep(templateMap[customNodeType.LLM].v0.params),
			...(currentNode?.params || {}),
		}

		// @ts-ignore
		nodeParams = handleOldTools(nodeParams)
		return {
			...nodeParams,
			model_config: {
				...templateMap[customNodeType.LLM].v0.params.model_config,
				...nodeParams.model_config,
			},
			messages: isNull(nodeParams?.messages)
				? templateMap[customNodeType.LLM].v0.params.messages
				: nodeParams?.messages,
		}
	}, [currentNode?.params, handleOldTools])

	// console.log(currentNode, initialValues)

	return {
		initialValues,
	}
}
