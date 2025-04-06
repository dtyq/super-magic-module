import { useFlow } from "@/MagicFlow/context/FlowContext/useFlow"
import { useNodes } from "@/MagicFlow/context/NodesContext/useNodes"
import { useMemoizedFn } from "ahooks"
import { useState } from "react"

type UseEditName = {
	id: string
}

export default function useEditName({ id }: UseEditName) {
	const [isEdit, setIsEdit] = useState(false)

	const { nodeConfig, updateNodeConfig } = useFlow()
	const { nodes, setNodes } = useNodes()

	const onChangeName = useMemoizedFn((newName: string) => {
		setIsEdit(false)
		const node = nodeConfig[id]

		const resultData = {
			...node,
			name: newName,
		}

		updateNodeConfig(resultData)
		setNodes([...nodes])
	})

	return {
		isEdit,
		setIsEdit,
		onChangeName,
	}
}
