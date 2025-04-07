import type { FormInstance } from "antd"
import { useFlow } from "@dtyq/magic-flow/MagicFlow/context/FlowContext/useFlow"
import { useCurrentNode } from "@dtyq/magic-flow/MagicFlow/nodes/common/context/CurrentNode/useCurrentNode"
import { useUpdateEffect } from "ahooks"

type UseCurrentNodeUpdateProps = {
	form: FormInstance<any>
	initialValues?: any
}

export default function useCurrentNodeUpdate({ form }: UseCurrentNodeUpdateProps) {
	const { flow } = useFlow()

	const { currentNode } = useCurrentNode()

	useUpdateEffect(() => {
		form.setFieldsValue({
			...currentNode?.params,
		})
	}, [flow, currentNode])
}
