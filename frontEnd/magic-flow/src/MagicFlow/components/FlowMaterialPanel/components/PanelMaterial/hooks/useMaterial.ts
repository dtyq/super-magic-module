import { getExecuteNodeList } from "@/MagicFlow/constants"
import { useFlow } from "@/MagicFlow/context/FlowContext/useFlow"
import { useMagicFlow } from "@/MagicFlow/context/MagicFlowContext/useMagicFlow"
import { BaseNodeType } from "@/MagicFlow/register/node"
import { getNodeGroups } from "@/MagicFlow/utils"
import { useMemoizedFn } from "ahooks"
import { useMemo } from "react"


type MaterialProps = {
	keyword:string
}

export default function useMaterial ({ keyword }: MaterialProps) {

	// 暂时由前端写死
	const nodeList = getExecuteNodeList()

	const { displayMaterialTypes } = useMagicFlow()

    const { flow } = useFlow()

	// 动态的节点列表
	const dynamicNodeList = useMemo(() => {
		return nodeList.filter(n => displayMaterialTypes.includes(n?.schema?.id) && n.schema.label.includes(keyword))
	}, [nodeList, displayMaterialTypes])

	// 获取分组节点列表
	const getGroupNodeList = useMemoizedFn((nodeTypes: BaseNodeType[]) => {
		return dynamicNodeList.filter(n => {
			return nodeTypes.includes(n.schema.id)
		})
	})

	// 过滤出有节点数据的分组列表，并往里边塞节点的schema
	const filterNodeGroups = useMemo(() => {
		const allNodeGroups = getNodeGroups()
		return allNodeGroups.map(nodeGroup => {
			const dynamicNodes = getGroupNodeList(nodeGroup.nodeTypes)
			const nodeTypes = dynamicNodes.map(n => n.schema.id)

			if( nodeTypes?.length === 0) return null

			return {
				...nodeGroup,
				nodeTypes,
				nodeSchemas: dynamicNodes,
				isGroupNode: nodeGroup.children?.length! > 0
			}
		}).filter(n => !!n)
	}, [getGroupNodeList, keyword, flow])

	return {
		nodeList: dynamicNodeList,
		getGroupNodeList,
		filterNodeGroups
	}

}
