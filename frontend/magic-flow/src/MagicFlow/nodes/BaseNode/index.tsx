import { useFlowInteraction } from "@/MagicFlow/components/FlowDesign/context/FlowInteraction/useFlowInteraction"
import FlowPopup from "@/MagicFlow/components/FlowPopup"
import { prefix } from "@/MagicFlow/constants"
import { useExtraNodeConfig } from "@/MagicFlow/context/ExtraNodeConfigContext/useExtraNodeConfig"
import { nodeManager } from "@/MagicFlow/register/node"
import { getNodeVersion } from "@/MagicFlow/utils"
import { Flex, Popover, Skeleton, Tooltip } from "antd"
import { IconBugFilled, IconChevronDown } from "@tabler/icons-react"
import clsx from "clsx"
import i18next from "i18next"
import _ from "lodash"
import React, { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { NodeProps, NodeToolbar, Position, useStore } from "reactflow"
import { useFlow } from "../../context/FlowContext/useFlow"
import SourceHandle from "../common/Handle/Source"
import NodeTestingHeader from "../common/NodeTestingHeader"
import DebuggerComp from "../common/components/DebuggerComp"
import TextEditable from "../common/components/TextEditable"
import { CurrentNodeProvider } from "../common/context/CurrentNode/Provider"
import { PopupProvider } from "../common/context/Popup/Provider"
import useAvatar from "../common/hooks/useAvatar"
import useBaseStyles from "../common/hooks/useBaseStyles"
import useDebug from "../common/hooks/useDebug"
import useDrag from "../common/hooks/useDrag"
import useEditName from "../common/hooks/useEditName"
import usePopup from "../common/hooks/usePopup"
import ToolbarComponent from "../common/toolbar"
import styles from "./index.module.less"

const connectionNodeIdSelector = (state: any) => state.connectionNodeId

//@ts-ignore
function BaseNode({ data, isConnectable, id, position }: NodeProps) {
	const {
		icon,
		label,
		color,
		type,
		index: nodeIndex,
		desc,
		style: defaultStyle,
		handle: { withSourceHandle, withTargetHandle },
		changeable,
	} = data

	const { t } = useTranslation()
	const connectionNodeId = useStore(connectionNodeIdSelector)

	const { showParamsComp } = useFlowInteraction()

	const isTarget = connectionNodeId && connectionNodeId !== id

	const { selectedNodeId, nodeConfig } = useFlow()

	const { isEdit, setIsEdit, onChangeName } = useEditName({ id })

	const currentNode = useMemo(() => {
		return nodeConfig[id]
	}, [nodeConfig, id])

	const { openPopup, onNodeWrapperClick, nodeName, onDropdownClick, setOpenPopup, closePopup } =
		usePopup({
			id,
			currentNode,
		})

	const ParamsComp = _.get(
		nodeManager.nodesMap,
		[type, getNodeVersion(currentNode), "component"],
		() => null,
	)

	const HeaderRight = _.get(
		nodeManager.nodesMap,
		[type, getNodeVersion(currentNode), "schema", "headerRight"],
		null,
	)

	// console.log("handlesConfig", id, withSourceHandle, withTargetHandle)

	const showDefaultSourceHandle = useMemo(() => {
		// 如果显示骨架，则业务的源点会消失，因此我们需要打开默认的源点
		if (!showParamsComp) return true
		return withSourceHandle
	}, [showParamsComp, withSourceHandle])

	const { onDragOver, onDragLeave, onDrop } = useDrag({ id })

	const canConnect = useMemo(() => {
		const sourceNode = nodeConfig?.[connectionNodeId]
		if (sourceNode && currentNode) {
			if (currentNode?.parentId) {
				return sourceNode.parentId === currentNode.parentId
			}
		}
		return true
	}, [connectionNodeId, nodeConfig, currentNode])

	const { headerBackgroundColor } = useBaseStyles({ color })

	const { isDebug, onDebugChange, allowDebug } = useDebug({ id })

	const { nodeStyleMap, commonStyle, customNodeRenderConfig } = useExtraNodeConfig()

	const { AvatarComponent } = useAvatar({ icon, color, currentNode })

	return (
		<CurrentNodeProvider currentNode={currentNode}>
			<PopupProvider closePopup={closePopup}>
				{selectedNodeId === id && changeable.operation && (
					<NodeToolbar position={position || Position.Top}>
						<ToolbarComponent id={id} />
					</NodeToolbar>
				)}
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
					<div
						className={clsx(styles.header, `${prefix}header`)}
						style={{ background: headerBackgroundColor }}
					>
						<div className={clsx(styles.left, `${prefix}left`)}>
							<Flex>
								{AvatarComponent}
								<TextEditable
									isEdit={isEdit}
									title={nodeName}
									onChange={onChangeName}
									setIsEdit={setIsEdit}
									className="nodrag"
								/>
								<Popover
									content={<FlowPopup nodeId={id} />}
									placement="right"
									showArrow={false}
									overlayClassName={clsx(styles.popup, `${prefix}popup`)}
									open={openPopup}
								>
									<Tooltip
										title={i18next.t("flow.changeNodeType", {
											ns: "magicFlow",
										})}
									>
										<IconChevronDown
											className={clsx(
												styles.hoverIcon,
												styles.modifyIcon,
												`${prefix}hover-icon`,
												`${prefix}modify-icon`,
											)}
											onClick={(e) => {
												onDropdownClick(e)
												setOpenPopup(!openPopup)
											}}
										/>
									</Tooltip>
								</Popover>
							</Flex>

							{!customNodeRenderConfig?.[type]?.hiddenDesc && (
								<div className={clsx(styles.desc, `${prefix}desc`)}>{desc}</div>
							)}
						</div>

						<div className={clsx(styles.right, `${prefix}right`)}>
							{HeaderRight}
							{allowDebug && (
								<Tooltip
									title={
										isDebug
											? i18next.t("flow.disableDebug", { ns: "magicFlow" })
											: i18next.t("flow.enableDebug", { ns: "magicFlow" })
									}
								>
									<IconBugFilled
										className={clsx(styles.icon, `${prefix}icon`, {
											[styles.checked]: isDebug,
											checked: isDebug,
										})}
										onClick={() => onDebugChange(!isDebug)}
										size={20}
									/>
								</Tooltip>
							)}
							{/* <div className={styles.indexIcon}>{nodeIndex + 1}</div> */}
							{/* <IconMore className={styles.iconMore}/> */}
						</div>
					</div>
					{showDefaultSourceHandle && (
						<SourceHandle
							nodeId={id}
							isConnectable={isConnectable}
							isSelected={selectedNodeId === id}
							type="source"
						/>
					)}
					{withTargetHandle && (
						<SourceHandle
							type="target"
							nodeId={id}
							position={Position.Left}
							isConnectable={isConnectable && canConnect}
							isSelected={selectedNodeId === id}
							isTarget={isTarget}
						/>
					)}
					<div
						className={clsx(styles.paramsComp, `${prefix}params-comp`, {
							[styles.isEmpty]: !showParamsComp,
							"is-empty": !showParamsComp,
						})}
					>
						{ParamsComp && showParamsComp && <ParamsComp />}
						{!showParamsComp && (
							<>
								<Skeleton />
								<Skeleton />
							</>
						)}
					</div>
				</div>
			</PopupProvider>
		</CurrentNodeProvider>
	)
}

export default BaseNode
