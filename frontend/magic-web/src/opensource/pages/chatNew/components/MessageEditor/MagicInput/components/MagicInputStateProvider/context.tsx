import { createContext } from "react"
import { createMagicInputStore } from "./state"

const MagicInputStateContext =
	createContext<ReturnType<typeof createMagicInputStore>>(createMagicInputStore())
export default MagicInputStateContext
