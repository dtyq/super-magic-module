import type { User } from "@/types/user"
import type { StateCreator } from "zustand"
import type { UserStore } from "../types"

interface UserInfoStates {
	info: User.UserInfo | null
}

interface UserInfoActions {
	setUserInfo: (info: User.UserInfo) => void
}

export type UserInfoSlice = UserInfoStates & UserInfoActions

export const createUserInfoSlice: StateCreator<UserStore, [], [], UserInfoSlice> = (set) => ({
	info: null,
	setUserInfo: (info: User.UserInfo) => {
		console.log("setUserInfo", info)
		set({ info })
	},
})
