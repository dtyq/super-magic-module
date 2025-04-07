import type { UserOrganizationSlice } from "./slices/organization"
import type { UserAccountSlice } from "./slices/account"
import type { UserInfoSlice } from "./slices/info"

export interface UserStore extends UserOrganizationSlice, UserAccountSlice, UserInfoSlice {}
