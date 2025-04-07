import type { User } from "@/types/user"
import type { StateCreator } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { platformKey } from "@/utils/storage"
import type { UserStore } from "../types"

interface UserOrganizationStates {
	organizations: User.UserOrganization[]
	/** magic 组织 Code */
	organizationCode?: string
	/** teamshare 组织 Code */
	teamshareOrganizationCode?: string
	magicOrganizationMap: Record<string, User.MagicOrganization>
}

interface UserOrganizationActions {
	setOrganizationCode: (organizationCode: string) => void
}

export type UserOrganizationSlice = UserOrganizationStates & UserOrganizationActions

export const createUserOrganizationSlice: StateCreator<
	UserStore,
	[],
	[["zustand/persist", UserOrganizationStates]],
	UserOrganizationSlice
> = persist(
	(set) => ({
		organizationCode: "",
		teamshareOrganizationCode: "",
		organizations: [],
		magicOrganizationMap: {},
		setOrganizationCode: (organizationCode: string) => {
			set({ organizationCode })
		},
	}),
	{
		name: platformKey("store:user-organization"),
		storage: createJSONStorage(() => localStorage),
		partialize: (state) => ({
			magicOrganizationMap: state.magicOrganizationMap,
			teamshareOrganizationCode: state.teamshareOrganizationCode,
			organizationCode: state.organizationCode,
			organizations: state.organizations,
		}),
	},
)
