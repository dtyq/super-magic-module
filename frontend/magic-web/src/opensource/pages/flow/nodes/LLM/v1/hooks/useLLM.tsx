import { useMemo } from "react"
import { useCurrentNode } from "@dtyq/magic-flow/MagicFlow/nodes/common/context/CurrentNode/useCurrentNode"
import { cloneDeep, isNull } from "lodash-es"
import useOldToolsHandle from "./useOldToolsHandle"
import { v1Template } from "../template"

export default function useLLMV0() {
	const { currentNode } = useCurrentNode()

	const { handleOldTools } = useOldToolsHandle()

	const initialValues = useMemo(() => {
		let nodeParams = {
			...cloneDeep(v1Template.params),
			...(currentNode?.params || {}),
		}

		// @ts-ignore
		nodeParams = handleOldTools(nodeParams)
		return {
			...nodeParams,
			model_config: {
				...v1Template.params.model_config,
				...nodeParams.model_config,
				vision: nodeParams.model_config?.vision || false,
				vision_model: nodeParams.model_config?.vision_model || "",
			},
			messages: isNull(nodeParams?.messages)
				? v1Template.params.messages
				: nodeParams?.messages,
		}
	}, [currentNode?.params, handleOldTools])

	// console.log(currentNode, initialValues)

	return {
		initialValues,
	}
}
