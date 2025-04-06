import { prefix } from "@/MagicFlow/constants"
import clsx from "clsx"
import React, { useCallback, useMemo, useRef } from "react"
import SubGroup from "./components/SubGroup/SubGroup"
import LazySubGroup from "./components/LazySubGroup"
import useMaterial from "./hooks/useMaterial"
import styles from "./index.module.less"

export interface PanelMaterialProps {
	keyword: string
	// 是否从端点出来的菜单栏
	isHoverMenu?: boolean
	// 由上层传入的Item项
	MaterialItemFn: (props: Record<string, any>) => JSX.Element | null
}

// 使用React.memo包装PanelMaterial组件，避免不必要的重新渲染
const PanelMaterial = React.memo(
	function PanelMaterial({ keyword, MaterialItemFn }: PanelMaterialProps) {
		const { nodeList, filterNodeGroups, getGroupNodeList } = useMaterial({ keyword })

		const containerRef = useRef<HTMLDivElement>(null)

		// 使用useCallback优化renderMaterialItem函数，避免不必要的重新创建
		const renderMaterialItem = useCallback(
			(n: any, extraProps: Record<string, any> = {}) => {
				// 使用解构赋值获取schema中的属性
				const { key, ...restSchema } = n.schema
				// 创建一个固定的key，避免每次渲染生成新的字符串
				const itemKey = key || extraProps.key || `item-${restSchema?.id || 0}`

				// 直接返回MaterialItemFn组件，传递必要的props
				return <MaterialItemFn {...restSchema} {...extraProps} key={itemKey} />
			},
			[MaterialItemFn],
		)

		// 使用useMemo优化节点列表渲染，只在nodeList或MaterialItemFn变化时重新计算
		const renderedNodeList = useMemo(() => {
			return nodeList.map((n, i) => {
				const { key, ...restSchema } = n.schema
				return <MaterialItemFn {...restSchema} key={key || `node-${i}`} />
			})
		}, [nodeList, MaterialItemFn])

		// 使用useCallback优化shouldUseLazyLoad函数
		const shouldUseLazyLoad = useCallback((nodeGroup: any) => {
			return nodeGroup?.children && nodeGroup.children.length > 5
		}, [])

		// 使用useMemo优化NodeGroup的渲染，只在filterNodeGroups变化时重新计算
		const renderedNodeGroups = useMemo(() => {
			if (filterNodeGroups?.length === 0) {
				return renderedNodeList
			}

			return (
				<div className={clsx(styles.nodeGroups, `${prefix}node-groups`)}>
					{filterNodeGroups.map((nodeGroup, i) => (
						<div
							className={clsx(styles.nodeGroup, `${prefix}node-group`)}
							key={`group-${i}`}
						>
							<div className={clsx(styles.groupName, `${prefix}group-name`)}>
								{nodeGroup?.groupName}
							</div>
							{!nodeGroup?.isGroupNode &&
								nodeGroup?.nodeSchemas?.map?.((n, i) => {
									const { key, ...restSchema } = n.schema
									return (
										<MaterialItemFn
											inGroup={false}
											{...restSchema}
											key={key || `schema-${i}`}
										/>
									)
								})}
							{nodeGroup?.isGroupNode &&
								nodeGroup?.children?.map((subGroup, subGroupIndex) => {
									const subGroupKey = `${subGroupIndex}-${subGroup.groupName}`
									return shouldUseLazyLoad(nodeGroup) ? (
										<LazySubGroup
											subGroup={subGroup}
											getGroupNodeList={getGroupNodeList}
											materialFn={renderMaterialItem}
											index={subGroupIndex}
											key={`lazy-sub-group-${subGroupKey}`}
										/>
									) : (
										<SubGroup
											subGroup={subGroup}
											getGroupNodeList={getGroupNodeList}
											key={`sub-group-${subGroupKey}`}
											materialFn={(n, extraProps) =>
												renderMaterialItem(n, {
													...extraProps,
													key: `item-${subGroupKey}-${n.schema?.id || 0}`,
												})
											}
										/>
									)
								})}
						</div>
					))}
				</div>
			)
		}, [
			filterNodeGroups,
			renderedNodeList,
			getGroupNodeList,
			renderMaterialItem,
			shouldUseLazyLoad,
		])

		return (
			<div
				ref={containerRef}
				className={clsx(styles.panelMaterial, `${prefix}panel-material-list`)}
				onClick={(e) => e.stopPropagation()}
			>
				{renderedNodeGroups}
			</div>
		)
	},
	(prevProps, nextProps) => {
		// 只有keyword发生变化时才重新渲染
		return (
			prevProps.keyword === nextProps.keyword &&
			prevProps.MaterialItemFn === nextProps.MaterialItemFn
		)
	},
)

export default PanelMaterial
