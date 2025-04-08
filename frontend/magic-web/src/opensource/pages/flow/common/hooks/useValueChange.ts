import { useFlow } from "@dtyq/magic-flow/MagicFlow/context/FlowContext/useFlow"
import { useCurrentNode } from "@dtyq/magic-flow/MagicFlow/nodes/common/context/CurrentNode/useCurrentNode"
import { useMemoizedFn } from "ahooks"
import { set } from "lodash-es"

export default function useValueChange() {
	const { currentNode } = useCurrentNode()
	const { updateNodeConfig } = useFlow()

	const onValuesChange = useMemoizedFn((changeValues) => {
		if (!currentNode) return

		Object.entries(changeValues).forEach(([changeKey, changeValue]) => {
			set(currentNode, ["params", changeKey], changeValue)
		})

		updateNodeConfig({
			...currentNode,
		})
	})

	return {
		onValuesChange,
	}
}
