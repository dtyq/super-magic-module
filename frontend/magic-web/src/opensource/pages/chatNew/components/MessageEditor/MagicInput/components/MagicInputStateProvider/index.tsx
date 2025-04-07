import type { PropsWithChildren } from "react"
import { useMemo } from "react"
import MagicInputStateContext from "./context"
import { createMagicInputStore } from "./state"

const MagicInputStateProvider = ({ children }: PropsWithChildren) => {
	const value = useMemo(() => createMagicInputStore(), [])

	return (
		<MagicInputStateContext.Provider value={value}>{children}</MagicInputStateContext.Provider>
	)
}

export default MagicInputStateProvider
