import type { PersistStorage } from "zustand/middleware"
import type { UseStore } from "idb-keyval"
import { get, set, del, promisifyRequest } from "idb-keyval" // can use anything: IndexedDB, Ionic Storage, etc.
import { debounce } from "lodash-es"

/**
 * @description 重写 idb-keyval 实现版本更新后的
 * @param {string} dbName
 * @param {string} storeName
 * @param {number} version
 */
function createStore(dbName: string, storeName: string, version: number): UseStore {
	const request = indexedDB.open(dbName, version)
	request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
		const db = (event.target as IDBOpenDBRequest).result

		// 检查并创建新对象存储
		if (!db.objectStoreNames.contains(storeName)) {
			db.createObjectStore(storeName)
			console.log(`Object store ${storeName} created.`)
		}
	}
	const dbp = promisifyRequest(request)
	return (txMode, callback) =>
		dbp.then((db) => callback(db.transaction(storeName, txMode).objectStore(storeName)))
}

/**
 * @description 规范indexeddb的使用，尽量收集为一个数据库
 * @param dbName
 * @param storeName
 * @param version
 */
export const createPersistStorage = <P>(
	dbName: string,
	storeName: string,
	version: number = 1,
): PersistStorage<P> => {
	const db: UseStore = createStore(dbName, storeName, version)

	return {
		getItem: async (name: string) => {
			const data = await get(name, db)
			if (!data) {
				return get("default", db)
			}
			return data
		},
		setItem: debounce(async (name: string, value) => {
			if (name !== "default") {
				await set(name, value, db)
			} else {
				await set(name, {}, db)
			}
		}, 1000),
		removeItem: async (name: string) => {
			await del(name, db)
		},
	}
}
