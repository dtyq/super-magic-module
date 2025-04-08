import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import { isEqual } from "lodash-es"
import Logger from "@/utils/log/Logger"
import { devtools } from "zustand/middleware"
import type { UserStore } from "./types"
import { createUserOrganizationSlice } from "./slices/organization"
import { createUserInfoSlice } from "./slices/info"
import { createUserAccountSlice } from "./slices/account"

const console = new Logger("user store", "orange")

export const useUserStore = create<UserStore>()(
	devtools(
		immer((...args) => ({
			...createUserOrganizationSlice(...args),
			...createUserInfoSlice(...args),
			...createUserAccountSlice(...args),
		})),
	),
)

// const firstLoad = true

useUserStore.subscribe((state, prevState) => {
	if (!isEqual(state.info, prevState.info)) {
		console.log("用户信息变更，重新初始化数据", {
			current: state.info,
			prev: prevState.info,
		})
	}
})

// window.useUserStore = useUserStore
