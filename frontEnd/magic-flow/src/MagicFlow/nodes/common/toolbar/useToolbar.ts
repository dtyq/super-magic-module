
import { useMemoizedFn } from "ahooks"
import { useFlow } from "@/MagicFlow/context/FlowContext/useFlow"
import { generateSnowFlake } from "@/common/utils/snowflake"
import { useStoreApi } from "reactflow"
import { useFlowInteraction } from "@/MagicFlow/components/FlowDesign/context/FlowInteraction/useFlowInteraction"
import useViewport from "@/MagicFlow/components/common/hooks/useViewport"
import { nodeManager } from "@/MagicFlow/register/node"
import { useExternal } from "@/MagicFlow/context/ExternalContext/useExternal"
import { defaultEdgeConfig } from "@/MagicFlow/edges"
import { generatePasteNode, judgeIsLoopBody, judgeLoopNode } from "@/MagicFlow/utils"
import _ from "lodash"
import { useNodes } from "@/MagicFlow/context/NodesContext/useNodes"

export const pasteTranslateSize = 20

export default function useToolbar () {

	const {  debuggerMode, nodeConfig, edges, updateNextNodeIdsByDeleteEdge, setEdges, setSelectedNodeId, setNodeConfig, notifyNodeChange } = useFlow()
	const { setNodes, nodes } = useNodes()
	const { layout } = useFlowInteraction()

	const { paramsName } = useExternal()

	const { updateViewPortToTargetNode } = useViewport()

	const store = useStoreApi()

	// 删除单个节点
	const deleteNode = useMemoizedFn((id: string) => {
		const deleteIds = _.castArray(id).reduce((acc, nId) => {
			const n = nodeConfig[nId]
			// @ts-ignore
			const nodeType = n[paramsName.nodeType]
			// 如果删除的是分组节点，则需要把子节点一并删除
			if(judgeIsLoopBody(nodeType)) {
				const subNodeIds = nodes.filter(_n => _n.parentId === n.id).map(_n => _n.id)
				const result = [...subNodeIds, n.id]
				// 如果删除的是循环体，则需要将循环节点一并删除
				if(n.meta.parent_id) {
					result.push(n.meta.parent_id)
				}
				return result
			}
			// 如果删除的是循环节点，则需要把循环体和循环体内节点删除
			if(judgeLoopNode(nodeType)) {
				const loopBody = nodes.find(_n => _n.meta.parent_id === n.id)
				if(loopBody) {
					const loopBodyNodeIds = nodes.filter(_n => _n.meta.parent_id === loopBody?.id).map(_n => _n.id)
					return [...loopBodyNodeIds,loopBody.id, n.id]
				}
			}
			return [...acc, n.id]
		}, [] as string[])


		const deleteEdges = edges.filter(e => deleteIds.includes(e.target) || deleteIds.includes(e.source))
		const leaveEdges = edges.filter(e => !deleteIds.includes(e.target) && !deleteIds.includes(e.source))

		// 更新边数据
		setEdges(leaveEdges)

		// 更新nextNodeIds
		deleteEdges.forEach(e => updateNextNodeIdsByDeleteEdge(e))

		setNodes(nodes.filter(n => !deleteIds.includes(n.id)))

		deleteIds.forEach(id => {
			if (Reflect.has(nodeConfig, id)) {
				Reflect.deleteProperty(nodeConfig, id)
				setNodeConfig({...nodeConfig})
			}
		})

        notifyNodeChange?.()

		if (debuggerMode) {
			console.trace("删除了节点", id)
		}
	})

	const pasteNode = useMemoizedFn((id) => {
		const storeStates = store.getState()
		const node = nodes.find(n => n.id === id)
        if(!node) return
		const config = nodeConfig[id]

		const { pasteNode: _pasteNode } = generatePasteNode(node, paramsName)

		const newId = _pasteNode.id

		const newEdge = {
			id: generateSnowFlake(),
			source: id,
			target: newId,
			...defaultEdgeConfig
		}

		/** 如果上一个节点是分支，则在分支内部也要添加next_nodes */
		// TODO 需要改成自定义参数名，支持next_nodes或者nextNodes
		if (nodeManager.branchNodeIds.includes(`${node[paramsName.nodeType]}`)) {
			config?.content?.branches?.[0]?.nextNodes?.push?.(newId)
			config?.content?.branches?.[0]?.next_nodes?.push?.(newId)
		}
		config?.nextNodes?.push(newId)
		config?.next_nodes?.push(newId)

		edges.push(newEdge)
		nodes.push(_pasteNode)
		setNodes([...nodes])
		nodeConfig[newId] = _pasteNode

		storeStates.unselectNodesAndEdges()

		setTimeout(() => {
			const layoutNodes = layout()
			const currentNode = layoutNodes.find(n => n.node_id === newId)
			updateViewPortToTargetNode(currentNode)
			setSelectedNodeId(null)
		}, 200)

        notifyNodeChange?.()

	})

	return {
		deleteNode,
		pasteNode
	}
}
