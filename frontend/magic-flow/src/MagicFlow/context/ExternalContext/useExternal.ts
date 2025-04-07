import React from "react"
import { ExternalContext } from "./Context"

export const useExternal = () => {
	return React.useContext(ExternalContext)
}
