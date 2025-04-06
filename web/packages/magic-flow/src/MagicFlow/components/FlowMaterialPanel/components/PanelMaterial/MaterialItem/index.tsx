import { prefix } from "@/MagicFlow/constants"
import { useExternal } from "@/MagicFlow/context/ExternalContext/useExternal"
import { useFlow } from "@/MagicFlow/context/FlowContext/useFlow"
import { NodeSchema } from "@/MagicFlow/register/node"
import { MagicFlow } from "@/MagicFlow/types/flow"
import {
	generateLoopBody,
	generateNewNode,
	getLatestNodeVersion,
	judgeIsLoopBody,
	judgeLoopNode,
} from "@/MagicFlow/utils"
import { generateSnowFlake } from "@/common/utils/snowflake"
import { Tooltip } from "antd"
import { IconHelp, IconPlus } from "@tabler/icons-react"
import { useMemoizedFn } from "ahooks"
import clsx from "clsx"
import _ from "lodash"
import React from "react"
import { Edge, useReactFlow } from "reactflow"
import useAvatar from "./hooks/useAvatar"
import styles from "./index.module.less"

type MaterialItemProps = NodeSchema & {
	showIcon?: boolean
	inGroup?: boolean
	avatar?: string
}

export default function MaterialItem({
	showIcon = true,
	inGroup = false,
	avatar,
	...item
}: MaterialItemProps) {
	const { addNode, selectedNodeId, nodeConfig, edges } = useFlow()

	const reactflow = useReactFlow()

	const { paramsName } = useExternal()

	const onDragStart = useMemoizedFn((event) => {
		event.dataTransfer.setData("node-data", JSON.stringify(item))
		event.dataTransfer.effectAllowed = "move"
	})

	const onAddItem = useMemoizedFn(() => {
		// 当添加循环体的时候，实际添加的元素的多个的
		const newNodes = []
		const newEdges = [] as Edge[]
		// 是否在分组内添加节点
		let isAddInGroup = false
		const selectedNode = nodeConfig?.[selectedNodeId!]
		const isLoopBody = judgeIsLoopBody(selectedNode?.[paramsName.nodeType])
		if (selectedNodeId) {
			isAddInGroup = isLoopBody || !!selectedNode?.parentId
		}
		const id = generateSnowFlake()

		const position = reactflow.screenToFlowPosition({
			x: 400,
			y: 200,
		})

		// console.log("position", position)

		const currentNodeSchema = _.cloneDeep(item)

        const newNode = generateNewNode(currentNodeSchema, paramsName, id, position)

		if (isAddInGroup) {
			// 用于处理当在分组body新增节点后，继续新增节点应该还是在分组内
			const parentId = isLoopBody ? selectedNodeId || undefined : selectedNode?.parentId
			newNode.parentId = parentId
			newNode.expandParent = true
			newNode.extent = "parent"
			newNode.meta = {
				position: {
					x: 100,
					y: 200,
				},
				parent_id: parentId,
			}
		}

		newNodes.push(newNode)
		// 如果新增的是循环，则需要多新增一个循环体和一条边
		if (judgeLoopNode(newNode[paramsName.nodeType])) {
			const { newNodes: bodyNodes, newEdges: bodyEdges } = generateLoopBody(
				newNode,
				paramsName,
				edges,
			)
			newNodes.push(...bodyNodes)
			newEdges.push(...bodyEdges)
		}

		addNode(newNodes, newEdges)
	})

	const { AvatarComponent } = useAvatar({
		...item,
		avatar,
		showIcon,
	})

	return (
		<div
			className={clsx(
				styles.materialItem,
				{
					[styles.inGroup]: inGroup,
				},
				`${prefix}material-item`,
			)}
			draggable
			onDragStart={onDragStart}
		>
			<div className={clsx(styles.header, `${prefix}header`)}>
				<div className={clsx(styles.left, `${prefix}left`)}>
					{AvatarComponent}
					<span className={clsx(styles.title, `${prefix}title`)}>{item.label}</span>
					{item.desc && (
						<Tooltip title={item.desc} showArrow={false}>
							<IconHelp
								color="#1C1D2359"
								size={22}
								className={clsx(styles.help, `${prefix}help`)}
							/>
						</Tooltip>
					)}
				</div>
				<IconPlus
					className={clsx(styles.plus, `${prefix}plus`)}
					onClick={onAddItem}
					stroke={2}
					size={20}
				/>
			</div>
		</div>
	)
}
