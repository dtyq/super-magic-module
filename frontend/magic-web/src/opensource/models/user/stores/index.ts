import { userStore as baseStore } from "./user.store"
import { accountStore } from "./account.store"

export class UserStore {
	user = baseStore

	account = accountStore
}

export const userStore = new UserStore()
