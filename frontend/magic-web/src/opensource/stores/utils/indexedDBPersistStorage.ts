import type { PersistStorage } from "zustand/middleware"
import type { UseStore } from "idb-keyval"
import { get, set, del } from "idb-keyval" // can use anything: IndexedDB, Ionic Storage, etc.
import { platformKey } from "@/utils/storage"

export const genIndexedDBPersistStorageName = (name: string) =>
	[platformKey(`${name}-db`), platformKey(`${name}-store`)] as [string, string]

export const createIndexedDBPersistStorage: <P>(
	db: UseStore,
	defaultState: { state: P; version: number },
) => PersistStorage<P> = (db, defaultState) => ({
	getItem: async (name: string) => {
		const data = await get(name, db)
		if (!data) {
			return get("default", db)
		}
		return data
	},
	setItem: async (name: string, value) => {
		if (name !== "default") {
			await set(name, value, db)
		} else {
			await set(name, defaultState, db)
		}
	},
	removeItem: async (name: string) => {
		await del(name, db)
	},
})
