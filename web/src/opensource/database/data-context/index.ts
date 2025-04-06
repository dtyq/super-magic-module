import { platformKey } from "@/utils/storage"
import Dexie from "dexie"
import { DataContextDb } from "./types"

export const DataContextDbName = (magicId: string, userId: string) =>
	platformKey(`data-content/${magicId}/${userId}`)

export const initDataContextDb = (magicId: string, userId: string) => {
	const db = new Dexie(DataContextDbName(magicId, userId)) as DataContextDb

	db.version(1).stores({
		user_info: "&user_id",
		group_info: "&id",
	})

	return db
}
