import React, { useState } from "react"
import ReactFlow, { Controls, MiniMap, Panel, SelectionMode } from "reactflow"
import styles from "./index.module.less"

import { prefix } from "@/MagicFlow/constants"
import { useExternal } from "@/MagicFlow/context/ExternalContext/useExternal"
import { Tooltip } from "antd"
import clsx from "clsx"
import "reactflow/dist/style.css"
import { useFlow } from "../../context/FlowContext/useFlow"
import { edgeModels } from "../../edges"
import { ConnectionLine } from "../../edges/ConnectionLine"
import nodeModels from "../../nodes/index"
import FlowBackground from "./components/FlowBackground"
import { Interactions } from "./components/InteractionSelect"
import SelectionTools from "./components/SelectionTools"
import useSelections from "./components/SelectionTools/useSelections"
import { FlowInteractionProvider } from "./context/FlowInteraction/Provider"
import useFlowControls from "./hooks/useFlowControls"
import useFlowEvents from "./hooks/useFlowEvents"
import useNodeClick from "./hooks/useNodeClick"
import useTargetToErrorNode from "./hooks/useTargetToErrorNode"
import { useNodes } from "@/MagicFlow/context/NodesContext/useNodes"

export default function FlowDesign() {
	const { edges, onEdgesChange, onConnect, flowInstance } =
		useFlow()
	const { nodes, onNodesChange } = useNodes()

	// 分辨率小于15% | 全量渲染时，关闭params渲染
	const [showParamsComp, setShowParamsComp] = useState(true)

	const { nodeClick, onNodeClick, onPanelClick } = useNodeClick()

	const {
		showSelectionTools,
		setShowSelectionTools,
		selectionNodes,
		selectionEdges,
		onSelectionChange,
		onSelectionEnd,
		onCopy,
	} = useSelections({
		flowInstance,
	})

	const {
		controlItemGroups,
		resetLastLayoutData,
		resetCanLayout,
		layout,
		showMinMap,
		currentZoom,
		onMove,
		interaction,
	} = useFlowControls({
		setShowParamsComp,
		nodeClick,
		selectionNodes,
		selectionEdges,
		flowInstance,
	})

	const {
		onNodeDragStop,
		onDrop,
		onDragOver,
		reactFlowWrapper,
		onReactFlowClick,
		onNodeDragStart,
		onNodeDrag,
		isDragging,
		onNodesDelete,
		onEdgeClick,
		onEdgesDelete,
		onAddItem,
		onlyRenderVisibleElements,
	} = useFlowEvents({
		resetLastLayoutData,
		resetCanLayout,
		currentZoom,
		setShowParamsComp,
	})

	/** 外部传的参数优先级最高 */
	const { onlyRenderVisibleElements: externalOnlyRenderVisibleElements } = useExternal()

	/** 运行错误时，定位到错误节点 */
	useTargetToErrorNode()

	return (
		<div className={styles.flowDesign} ref={reactFlowWrapper}>
			<FlowInteractionProvider
				isDragging={isDragging}
				nodeClick={nodeClick}
				resetLastLayoutData={resetLastLayoutData}
				onAddItem={onAddItem}
				layout={layout}
				showParamsComp={showParamsComp}
				showSelectionTools={showSelectionTools}
				setShowSelectionTools={setShowSelectionTools}
				//@ts-ignore
				onNodesDelete={onNodesDelete}
				currentZoom={currentZoom}
				reactFlowWrapper={reactFlowWrapper}
				selectionNodes={selectionNodes}
				selectionEdges={selectionEdges}
			>
				<ReactFlow
					//@ts-ignore
					nodeTypes={nodeModels}
					edgeTypes={edgeModels}
					//@ts-ignore
					nodes={nodes}
					edges={edges}
					onNodesChange={onNodesChange}
					onEdgesChange={onEdgesChange}
					onConnect={onConnect}
					onNodeClick={onNodeClick}
					onEdgeClick={onEdgeClick}
					onNodeDragStart={onNodeDragStart}
					onNodeDrag={onNodeDrag}
					onNodeDragStop={onNodeDragStop}
					onDrop={onDrop}
					onDragOver={onDragOver}
					onClick={onReactFlowClick}
					onNodesDelete={onNodesDelete}
					onEdgesDelete={onEdgesDelete}
					minZoom={0.01}
					maxZoom={8}
					connectionLineComponent={ConnectionLine}
					panOnScroll={interaction === Interactions.TouchPad}
					zoomOnScroll={interaction === Interactions.Mouse}
					panOnDrag={interaction === Interactions.Mouse}
					// zoomOnPinch
					selectionOnDrag
					ref={flowInstance}
					onPaneClick={onPanelClick}
					zoomOnDoubleClick={false}
					onlyRenderVisibleElements={
						externalOnlyRenderVisibleElements || onlyRenderVisibleElements
					}
					// @ts-ignore
					onMove={onMove}
					selectionKeyCode={null}
					onSelectionChange={onSelectionChange}
					onSelectionEnd={onSelectionEnd}
					// 选中部分就算选中
					selectionMode={SelectionMode.Partial}
				>
					<Panel
						position="top-center"
						className={clsx(styles.selectionPanel, `${prefix}selection-panel`)}
					>
						<SelectionTools
							show={showSelectionTools}
							setShow={setShowSelectionTools}
							selectionNodes={selectionNodes}
							selectionEdges={selectionEdges}
							onCopy={onCopy}
						/>
					</Panel>
					<Controls
						showFitView={false}
						showInteractive={false}
						showZoom={false}
						className={clsx(styles.controls, `${prefix}controls`)}
						position="bottom-right"
					>
						{controlItemGroups.map((controlItems, i) => {
							return (
								<div className={styles.groupWrap} key={`group-${i}`}>
									{controlItems.map((c, index) => {
										return (
											<Tooltip
												title={c.tooltips}
												// @ts-ignore
												onClick={c.callback}
												key={`control-${c.tooltips}-${index}`}
											>
												<span
													className={clsx(
														styles.controlItem,
														`${prefix}control-item`,
														{
															// @ts-ignore
															[styles.lockItem]: c.isLock,
															// @ts-ignore
															[styles.isNotIcon]: c.isNotIcon,
															// @ts-ignore
															[styles.showMinMap]: c.showMinMap,
														},
													)}
												>
													{c.icon}
												</span>
											</Tooltip>
										)
									})}

									<svg className={clsx(styles.line, `${prefix}line`)}>
										<line
											x1={-10}
											y1={0}
											x2={-10}
											y2={20}
											stroke="#1C1D2314"
											strokeWidth="1"
										/>
									</svg>
								</div>
							)
						})}
					</Controls>
					<FlowBackground />
					{showMinMap && (
						<MiniMap
							nodeStrokeWidth={3}
							pannable
							position="bottom-right"
							className={clsx(styles.minMap, `${prefix}min-map`)}
							maskColor="rgba(0,0,0,0.2)"
						/>
					)}
				</ReactFlow>
			</FlowInteractionProvider>
		</div>
	)
}
