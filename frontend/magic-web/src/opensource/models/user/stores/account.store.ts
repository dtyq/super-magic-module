import { makeAutoObservable } from "mobx"
import type { User } from "@/types/user"

export class AccountStore {
	accounts: Array<User.UserAccount> = []

	constructor() {
		makeAutoObservable(this, {}, { autoBind: true })
	}

	/**
	 * @description 账号创建
	 */
	setAccount = (account: User.UserAccount) => {
		const exists = this.accounts.some((acc) => acc.magic_id === account.magic_id)
		if (!exists) {
			this.accounts.push(account)
		}
	}

	/**
	 * @description 移除账号
	 */
	deleteAccount = (unionId: string) => {
		const index = this.accounts.findIndex((acc) => acc.magic_id === unionId)
		if (index !== -1) {
			this.accounts.splice(index, 1)
		}
	}

	/**
	 * @description 更新账号
	 */
	updateAccount = (unionId: string, updatedAccount: Partial<User.UserAccount>) => {
		const index = this.accounts.findIndex((acc) => acc.magic_id === unionId)
		if (index !== -1) {
			this.accounts[index] = {
				...this.accounts[index],
				...updatedAccount,
			}
		}
	}
}

export const accountStore = new AccountStore()
