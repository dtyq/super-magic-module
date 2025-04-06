import type Dexie from "dexie"
import { DatabaseManager } from "./DatabaseManager"
import { AbstractBaseRepository } from "./AbstractBaseRepository"

/**
 * @description 全局repository层基类
 */
export class GlobalBaseRepository<T> extends AbstractBaseRepository<T> {
	// eslint-disable-next-line class-methods-use-this
	protected async getDB(): Promise<Dexie> {
		return DatabaseManager.getInstance().getGlobalDatabase()
	}
}
