import { IconPlus } from "@douyinfe/semi-icons"
import { Popover } from "antd"
import { useMemoizedFn, useUpdateEffect } from "ahooks"
import clsx from "clsx"
import React, { useState } from "react"
import { EdgeProps, getBezierPath } from "reactflow"
import FlowPopup from "../components/FlowPopup"
import { prefix } from "../constants"
import { useFlow } from "../context/FlowContext/useFlow"
import styles from "./index.module.less"

function CustomEdge({
	id,
	sourceX,
	sourceY,
	targetX,
	targetY,
	sourcePosition,
	targetPosition,
	markerEnd,
	source,
	sourceHandleId,
	target,
	style,
	data,
}: EdgeProps) {
	const { selectedEdgeId } = useFlow()
	const [popupOpen, setPopupOpen] = useState(false)

	const { allowAddOnLine } = data

	const [edgePath] = getBezierPath({
		sourceX: sourceX + 5,
		sourceY,
		sourcePosition,
		targetX: targetX - 5,
		targetY,
		targetPosition,
	})

	const [isHovered, setIsHovered] = useState(false)

	useUpdateEffect(() => {
		if (!selectedEdgeId) {
			setPopupOpen(false)
		}
	}, [selectedEdgeId])

	const handleMouseEnter = useMemoizedFn(() => {
		setIsHovered(true)
	})

	const handleMouseLeave = useMemoizedFn(() => {
		setIsHovered(false)
	})

	const handleAddIconMouseOver = useMemoizedFn(() => {
		setIsHovered(true)
	})

	const handleAddIconMouseLeave = useMemoizedFn(() => {
		setIsHovered(false)
	})

	return (
		<>
			{/* https://github.com/xyflow/xyflow/issues/1211#issuecomment-883673705 */}
			<path
				id={id}
				d={edgePath}
				className="react-flow__edge-path"
				markerEnd={markerEnd}
				fillRule="evenodd"
				style={{ ...style }}
			/>
			<path
				style={{ ...style, stroke: "transparent", strokeWidth: 48 }}
				d={edgePath}
				className="react-flow__edge-path-selector"
				markerEnd={undefined}
				fillRule="evenodd"
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
			/>

			{allowAddOnLine && (
				<foreignObject
					x={(sourceX + targetX) / 2 - 12}
					y={(sourceY + targetY) / 2 - 12}
					width={24}
					height={24}
					onMouseEnter={handleAddIconMouseOver}
					className={clsx(styles.addIconWrapper)}
					onMouseLeave={handleAddIconMouseLeave}
					style={{ display: isHovered ? "block" : "none" }}
				>
					<Popover
						content={
							<FlowPopup
								source={source}
								target={target}
								edgeId={id}
								// @ts-ignore
								sourceHandle={sourceHandleId}
							/>
						}
						placement="right"
						showArrow={false}
						overlayClassName={clsx(styles.popup, `${prefix}popup`)}
						open={popupOpen}
					>
						<IconPlus
							className={clsx(styles.addIcon, `${prefix}add-icon`)}
							style={{
								background: style?.stroke,
							}}
							onClick={() => {
								setPopupOpen(!popupOpen)
							}}
						/>
					</Popover>
				</foreignObject>
			)}
		</>
	)
}

export default CustomEdge
