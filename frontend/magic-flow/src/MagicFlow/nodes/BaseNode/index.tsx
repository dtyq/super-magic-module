import { useFlowInteraction } from "@/MagicFlow/components/FlowDesign/context/FlowInteraction/useFlowInteraction"
import { useExtraNodeConfig } from "@/MagicFlow/context/ExtraNodeConfigContext/useExtraNodeConfig"
import { nodeManager } from "@/MagicFlow/register/node"
import { getNodeVersion } from "@/MagicFlow/utils"
import _ from "lodash"
import React, { useMemo } from "react"
import { NodeProps, useStore } from "reactflow"
import { useFlow, useFlowNodes } from "../../context/FlowContext/useFlow"
import { CurrentNodeProvider } from "../common/context/CurrentNode/Provider"
import { PopupProvider } from "../common/context/Popup/Provider"
import useAvatar from "../common/hooks/useAvatar"
import useBaseStyles from "../common/hooks/useBaseStyles"
import useDebug from "../common/hooks/useDebug"
import useDrag from "../common/hooks/useDrag"
import useEditName from "../common/hooks/useEditName"
import usePopup from "../common/hooks/usePopup"
import NodeContent from "./components/NodeContent"
import NodeHandles from "./components/NodeHandles"
import NodeHeader from "./components/NodeHeader"
import NodeToolbar from "./components/NodeToolbar"
import NodeWrapper from "./components/NodeWrapper"

const connectionNodeIdSelector = (state: any) => state.connectionNodeId

//@ts-ignore
function BaseNode({ data, isConnectable, id, position }: NodeProps) {
	const {
		icon,
		color,
		type,
		desc,
		style: defaultStyle,
		handle: { withSourceHandle, withTargetHandle },
		changeable,
	} = data

	const connectionNodeId = useStore(connectionNodeIdSelector)
	const { showParamsComp } = useFlowInteraction()
	const isTarget = connectionNodeId && connectionNodeId !== id
	const { selectedNodeId } = useFlowNodes()
	const { nodeConfig } = useFlow()
	const { isEdit, setIsEdit, onChangeName } = useEditName({ id })

	const currentNode = useMemo(() => {
		return nodeConfig[id]
	}, [nodeConfig, id])

	const { openPopup, onNodeWrapperClick, nodeName, onDropdownClick, setOpenPopup, closePopup } =
		usePopup({
			id,
			currentNode,
		})

	const ParamsComp = useMemo(
		() =>
			_.get(
				nodeManager.nodesMap,
				[type, getNodeVersion(currentNode), "component"],
				() => null,
			),
		[type, currentNode, nodeManager.nodesMap],
	)

	const HeaderRight = _.get(
		nodeManager.nodesMap,
		[type, getNodeVersion(currentNode), "schema", "headerRight"],
		null,
	)

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
				<NodeToolbar
					selectedNodeId={selectedNodeId}
					id={id}
					changeable={changeable}
					position={position}
				/>

				<NodeWrapper
					id={id}
					selectedNodeId={selectedNodeId}
					onNodeWrapperClick={onNodeWrapperClick}
					defaultStyle={defaultStyle}
					commonStyle={commonStyle}
					nodeStyleMap={nodeStyleMap}
					type={type}
					onDragLeave={onDragLeave}
					onDragOver={onDragOver}
					onDrop={onDrop}
				>
					<NodeHeader
						id={id}
						headerBackgroundColor={headerBackgroundColor}
						AvatarComponent={AvatarComponent}
						isEdit={isEdit}
						setIsEdit={setIsEdit}
						nodeName={nodeName}
						onChangeName={onChangeName}
						openPopup={openPopup}
						setOpenPopup={setOpenPopup}
						onDropdownClick={onDropdownClick}
						type={type}
						desc={desc}
						customNodeRenderConfig={customNodeRenderConfig}
						HeaderRight={HeaderRight}
						allowDebug={allowDebug}
						isDebug={isDebug}
						onDebugChange={onDebugChange}
					/>

					<NodeHandles
						showDefaultSourceHandle
						withTargetHandle={withTargetHandle}
						nodeId={id}
						isConnectable={isConnectable}
						isSelected={selectedNodeId === id}
						canConnect={canConnect}
						isTarget={isTarget}
						showParamsComp
					/>

					<NodeContent showParamsComp ParamsComp={ParamsComp} />
				</NodeWrapper>
			</PopupProvider>
		</CurrentNodeProvider>
	)
}

export default BaseNode
