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
    flowInteractionRef: React.MutableRefObject<any>
    omitNodeKeys: string[]
}>  

export const ExternalContext = React.createContext({
	header: {},
    nodeToolbar: {},
	layoutOnMount: true,
    showExtraFlowInfo: true,    
    flowInteractionRef: {} as React.MutableRefObject<any>,
    omitNodeKeys: []
} as ExternalCtx)
