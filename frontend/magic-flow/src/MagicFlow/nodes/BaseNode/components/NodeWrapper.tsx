import clsx from "clsx"
import React, { memo } from "react"
import { prefix } from "@/MagicFlow/constants"
import styles from "../index.module.less"
import DebuggerComp from "../../common/components/DebuggerComp"
import NodeTestingHeader from "../../common/NodeTestingHeader"

interface NodeWrapperProps {
	id: string
	selectedNodeId: string
	onNodeWrapperClick: (e: React.MouseEvent) => void
	defaultStyle: React.CSSProperties
	commonStyle: React.CSSProperties | undefined
	nodeStyleMap: any
	type: string
	onDragLeave: (e: React.DragEvent) => void
	onDragOver: (e: React.DragEvent) => void
	onDrop: (e: React.DragEvent) => void
	children: React.ReactNode
}

const NodeWrapper = memo(
	({
		id,
		selectedNodeId,
		onNodeWrapperClick,
		defaultStyle,
		commonStyle,
		nodeStyleMap,
		type,
		onDragLeave,
		onDragOver,
		onDrop,
		children,
	}: NodeWrapperProps) => {
		return (
			<div
				className={clsx(styles.baseNodeWrapper, `${prefix}base-node-wrapper`, {
					[styles.isSelected]: selectedNodeId === id,
					selected: selectedNodeId === id,
				})}
				onClick={onNodeWrapperClick}
				style={{
					...defaultStyle,
					...(commonStyle || {}),
					...(nodeStyleMap?.[type] || {}),
				}}
				onDragLeave={onDragLeave}
				onDragOver={onDragOver}
				onDrop={onDrop}
			>
				<DebuggerComp id={id} />
				<NodeTestingHeader />
				{children}
			</div>
		)
	},
)

export default NodeWrapper
