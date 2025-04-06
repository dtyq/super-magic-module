import { getUserName } from "@/utils/modules/chat"
import type { ContactState } from "../types"

export const userInfoSelector = (uid?: string) => (state: ContactState) => {
	if (!uid) return undefined
	return state.userInfos.get(uid)
}

export const userNameSelector = (uid?: string) => (state: ContactState) => {
	if (!uid) return undefined
	return getUserName(state.userInfos.get(uid))
}
