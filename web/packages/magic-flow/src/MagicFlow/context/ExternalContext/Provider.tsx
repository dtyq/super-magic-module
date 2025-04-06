/**
 * 业务组件传入相关的自定义props
 */
import React, { useMemo } from "react"
import { ExternalContext, ExternalCtx } from "./Context"

export const ExternalProvider = ({
	header,
	nodeToolbar,
	materialHeader,
	paramsName,
	onlyRenderVisibleElements,
	layoutOnMount,
	allowDebug,
	showExtraFlowInfo,
	children,
}: ExternalCtx) => {
	const value = useMemo(() => {
		return {
			header,
			nodeToolbar,
			materialHeader,
			paramsName,
			onlyRenderVisibleElements,
			layoutOnMount,
			allowDebug,
			showExtraFlowInfo,
		}
	}, [
		header,
		nodeToolbar,
		materialHeader,
		paramsName,
		onlyRenderVisibleElements,
		layoutOnMount,
		allowDebug,
		showExtraFlowInfo,
	])

	return <ExternalContext.Provider value={value}>{children}</ExternalContext.Provider>
}
