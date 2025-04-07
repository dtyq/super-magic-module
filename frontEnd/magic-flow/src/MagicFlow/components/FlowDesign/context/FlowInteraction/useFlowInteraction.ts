import React from "react"
import { FlowInteractionContext } from "./Context"

export const useFlowInteraction = () => {
	return React.useContext(FlowInteractionContext)
}
