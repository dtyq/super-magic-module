import { prefix } from "@/MagicFlow/constants"
import clsx from "clsx"
import React from "react"
import SubGroup from "./components/SubGroup/SubGroup"
import useMaterial from "./hooks/useMaterial"
import styles from "./index.module.less"

interface PanelMaterialProps {
	keyword: string
	// 是否从端点出来的菜单栏
	isHoverMenu?: boolean
	// 由上层传入的Item项
	MaterialItemFn: (props: Record<string, any>) => JSX.Element | null
}

export default function PanelMaterial({ keyword, MaterialItemFn }: PanelMaterialProps) {
	const { nodeList, filterNodeGroups, getGroupNodeList } = useMaterial({ keyword })

	return (
		<div
			className={clsx(styles.panelMaterial, `${prefix}panel-material-list`)}
			onClick={(e) => e.stopPropagation()}
		>
			{filterNodeGroups?.length === 0 &&
				nodeList.map((n, i) => {
					// 从 n.schema 中提取 key 属性，如果存在的话
					const { key, ...restSchema } = n.schema
					// 直接传递 key 属性，而不是通过展开操作符
					return <MaterialItemFn {...restSchema} key={key || i} />
				})}

			{filterNodeGroups?.length !== 0 && (
				<div className={clsx(styles.nodeGroups, `${prefix}node-groups`)}>
					{filterNodeGroups.map((nodeGroup, i) => (
						<div className={clsx(styles.nodeGroup, `${prefix}node-group`)} key={i}>
							<div className={clsx(styles.groupName, `${prefix}group-name`)}>
								{nodeGroup?.groupName}
							</div>
							{!nodeGroup?.isGroupNode &&
								nodeGroup?.nodeSchemas?.map?.((n, i) => {
									// 从 n.schema 中提取 key 属性，如果存在的话
									const { key, ...restSchema } = n.schema
									// 直接传递 key 属性，而不是通过展开操作符
									return (
										<MaterialItemFn
											inGroup={false}
											{...restSchema}
											key={key || i}
										/>
									)
								})}
							{nodeGroup?.isGroupNode &&
								nodeGroup?.children?.map((subGroup, subGroupIndex) => {
									// console.log(nodeGroup)
									return (
										<SubGroup
											subGroup={subGroup}
											getGroupNodeList={getGroupNodeList}
											key={`sub-group-${subGroupIndex}`}
											materialFn={(n, extraProps) => {
												// 从 n.schema 中提取 key 属性，如果存在的话
												const { key, ...restSchema } = n.schema
												// 直接传递 key 属性，而不是通过展开操作符
												return (
													<MaterialItemFn
														{...restSchema}
														{...extraProps}
														key={
															key ||
															`item-${subGroupIndex}-${
																restSchema?.id || 0
															}`
														}
													/>
												)
											}}
										/>
									)
								})}
						</div>
					))}
				</div>
			)}
		</div>
	)
}
