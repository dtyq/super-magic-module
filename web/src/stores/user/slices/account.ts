import type { StateCreator } from "zustand"
import type { User } from "@/types/user"
import { createJSONStorage, persist } from "zustand/middleware"
import { platformKey } from "@/utils/storage"
import type { UserStore } from "../types"

interface UserAccountStates {
	/** 当前登录账号 */
	accounts: Array<User.UserAccount>
}

interface UserAccountActions {}

export type UserAccountSlice = UserAccountStates & UserAccountActions

export const createUserAccountSlice: StateCreator<
	UserStore,
	[],
	[["zustand/persist", UserAccountStates]],
	UserAccountSlice
> = persist<UserAccountSlice>(
	() => ({
		accounts: [],
	}),
	{
		name: platformKey("store:user-accounts"),
		storage: createJSONStorage(() => localStorage),
		partialize: (state) => ({
			accounts: state.accounts ?? [],
		}),
	},
)
