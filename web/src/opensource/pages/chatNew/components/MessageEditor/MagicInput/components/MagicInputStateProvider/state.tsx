import { create } from "zustand"
import type { Content } from "@tiptap/core"

export interface ReferFile {
	referFileId: string
	referText: string
}

export interface MagicInputState {
	selectText: Content | undefined
	setSelectText: (val: Content) => void
}

export const createMagicInputStore = () => {
	return create<MagicInputState>((set) => ({
		selectText: undefined,
		setSelectText: (val) => set({ selectText: val }),
	}))
}
