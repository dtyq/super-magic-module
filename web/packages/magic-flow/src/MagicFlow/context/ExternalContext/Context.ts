import { MagicFlow } from "@/MagicFlow/types/flow"
import React from "react"

export type ExternalCtx = React.PropsWithChildren<{
    header?: {
        buttons?: React.ReactElement
        backIcon?: React.ReactElement
		showImage?: boolean
		editEvent?: () => void
		defaultImage?: string
        customTags?: React.ReactElement
    }
    nodeToolbar?: {
		list: Array<{
			icon: () => React.ReactElement
			tooltip?: string
		}>
		mode?: "append" | "replaceAll"
	}
	materialHeader?: React.ReactElement
	paramsName: MagicFlow.ParamsName
	onlyRenderVisibleElements: boolean
	layoutOnMount: boolean
	allowDebug: boolean
	showExtraFlowInfo?: boolean
}>  

export const ExternalContext = React.createContext({
	header: {},
    nodeToolbar: {},
	layoutOnMount: true,
    showExtraFlowInfo: true,
} as ExternalCtx)
