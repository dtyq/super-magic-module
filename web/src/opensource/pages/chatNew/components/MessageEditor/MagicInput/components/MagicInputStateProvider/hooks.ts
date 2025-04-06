import { useContext } from "react"
import { useStore } from "zustand"
import MagicInputStateContext from "./context"
import type { MagicInputState } from "./state"

export function useMagicInputStore<T>(selector: (state: MagicInputState) => T): T {
	const store = useContext(MagicInputStateContext)
	return useStore(store, selector)
}
