import React from "react"
import styles from "./index.module.less"

// import useMaterialPanel from "./hooks/useMaterialPanel"
import { prefix } from "@/MagicFlow/constants"
import { useExternal } from "@/MagicFlow/context/ExternalContext/useExternal"
import SearchInput from "@/common/BaseUI/DropdownRenderer/SearchInput"
import TSIcon from "@/common/BaseUI/TSIcon"
import { Radio } from "antd"
import clsx from "clsx"
import i18next from "i18next"
import MaterialItem from "./components/PanelMaterial/MaterialItem"
import { TabObject } from "./constants"
import { PanelProvider } from "./context/PanelContext/Provider"
import useMaterialPanel from "./hooks/useMaterialPanel"
import useMaterialSearch from "./hooks/useMaterialSearch"
import useTab from "./hooks/useTab"

export const MaterialPanelWidth = 330

export default function FlowMaterialPanel() {
	const { tabContents, tabList, tab } = useTab()

	const { keyword, onSearchChange, agentType, setAgentType } = useMaterialSearch({ tab })

	const { show, setShow, stickyButtonStyle } = useMaterialPanel()

	const { materialHeader } = useExternal()

	return (
		<PanelProvider agentType={agentType} setAgentType={setAgentType}>
			<TSIcon
				type={show ? "ts-arrow-left" : "ts-arrow-right"}
				className={clsx(styles.stickyBtn, "stickyBtn")}
				onClick={() => setShow(!show)}
				style={stickyButtonStyle}
			/>
			<div
				className={clsx(styles.flowMaterialPanel, `${prefix}flow-material-panel`)}
				style={{
					width: show ? "280px" : 0,
				}}
			>
				{materialHeader ? (
					materialHeader
				) : (
					<Radio.Group defaultValue={TabObject.Material} buttonStyle="solid">
						{tabList.map((tabItem, i) => {
							return (
								<Radio.Button
									className={clsx(styles.tabItem, `${prefix}tab-item`, {
										[styles.active]: tab === tabItem.value,
										active: tab === tabItem.value,
									})}
									onClick={tabItem.onClick}
									key={i}
									value={tabItem.value}
								>
									{tabItem.label}
								</Radio.Button>
							)
						})}
					</Radio.Group>
				)}

				<div className={clsx(styles.search, `${prefix}search`)}>
					<SearchInput
						placeholder={i18next.t("common.search", { ns: "magicFlow" })}
						value={keyword}
						onChange={onSearchChange}
					/>
				</div>

				<div className={clsx(styles.materials, `${prefix}materials`)}>
					{tabContents.map(([DynamicContent, showContent], index) => {
						return (
							<div
								key={index}
								style={{ display: `${showContent ? "block" : "none"}` }}
								className={clsx(styles.blockItem, `${prefix}block-item`)}
							>
								{/* @ts-ignore */}
								<DynamicContent
									currentTab={tab}
									keyword={keyword}
									MaterialItemFn={(dynamicProps: any) => (
										<MaterialItem {...dynamicProps} />
									)}
								/>
							</div>
						)
					})}
				</div>
			</div>
		</PanelProvider>
	)
}
