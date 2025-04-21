import React from "react"
import styles from "./index.module.less"

// import useMaterialPanel from "./hooks/useMaterialPanel"
import { prefix } from "@/MagicFlow/constants"
import { useExternal } from "@/MagicFlow/context/ExternalContext/useExternal"
import clsx from "clsx"
import { TabObject } from "./constants"
import { PanelProvider } from "./context/PanelContext/Provider"
import useMaterialPanel from "./hooks/useMaterialPanel"
import useMaterialSearch from "./hooks/useMaterialSearch"
import useTab from "./hooks/useTab"
import StickyButton from "./components/sections/StickyButton"
import PanelHeader from "./components/sections/PanelHeader"
import SearchBar from "./components/sections/SearchBar"
import MaterialContent from "./components/sections/MaterialContent"
import { useMemo } from "react"

export const MaterialPanelWidth = 330

function FlowMaterialPanel() {
	const { tabContents, tabList, tab } = useTab()
	const { keyword, onSearchChange, agentType, setAgentType } = useMaterialSearch({ tab })
	const { show, setShow, stickyButtonStyle } = useMaterialPanel()
	const { materialHeader } = useExternal()

	// 使用useMemo缓存Panel Provider的value，避免不必要的重新渲染
	const providerValue = useMemo(() => {
		return { agentType, setAgentType }
	}, [agentType, setAgentType])

	// 使用useMemo缓存样式对象，避免每次渲染创建新对象
	const panelStyle = useMemo(() => {
		return { width: show ? "280px" : 0 }
	}, [show])

	return (
		<PanelProvider agentType={agentType} setAgentType={setAgentType}>
			<StickyButton show={show} setShow={setShow} stickyButtonStyle={stickyButtonStyle} />
			<div
				className={clsx(styles.flowMaterialPanel, `${prefix}flow-material-panel`)}
				style={panelStyle}
			>
				<PanelHeader materialHeader={materialHeader} tabList={tabList} tab={tab} />

				<SearchBar keyword={keyword} onSearchChange={onSearchChange} />

				<MaterialContent tabContents={tabContents} tab={tab} keyword={keyword} />
			</div>
		</PanelProvider>
	)
}

export default React.memo(FlowMaterialPanel)
