import { useContext } from "react"
import { useStoreWithEqualityFn } from "zustand/traditional"
import { contactStoreContext } from "@/opensource/providers/ContactProvider/context"
import type { ContactStoreState } from "."

export function useContactStore<T>(
	selector: (state: ContactStoreState) => T,
	equalityFn?: (a: T, b: T) => boolean,
): T {
	const store = useContext(contactStoreContext)
	if (!store) throw new Error("Missing ContactStoreContext.Provider in the tree")
	return useStoreWithEqualityFn(store, selector, equalityFn)
}

export function useContactInstance() {
	return useContext(contactStoreContext)
}
