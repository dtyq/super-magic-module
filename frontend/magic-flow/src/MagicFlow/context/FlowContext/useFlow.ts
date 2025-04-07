import React from "react"
import { FlowContext } from "./Context"

export const useFlow = () => {
	return React.useContext(FlowContext)
}
