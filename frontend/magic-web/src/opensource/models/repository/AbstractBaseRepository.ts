import type { IndexableType, Table, UpdateSpec } from "dexie"
import type Dexie from "dexie"

/**
 * @description repository层抽象基类
 */
export abstract class AbstractBaseRepository<T> {
	protected db: Dexie | undefined

	protected tableName: string

	constructor(tableName: string) {
		this.tableName = tableName
	}

	/**
	 * @description 获取数据库实例
	 */
	protected abstract getDB(): Promise<Dexie>

	/**
	 * @description 获取表对象
	 */
	protected async getTable(): Promise<Table<T, IndexableType>> {
		const db = await this.getDB()
		return db.table<T>(this.tableName)
	}

	/**
	 * @description 添加或更新数据
	 * @param data
	 */
	async put(data: T): Promise<void> {
		const table = await this.getTable()
		try {
			await table.put(data)
		} catch(error){
			console.log("-----", data)
			console.error(error)
		}
	}

	/**
	 * @description 获取单个数据
	 * @param key
	 */
	async get(key: IndexableType): Promise<T | undefined> {
		const table = await this.getTable()
		return table.get(key)
	}

	/**
	 * @description 获取所有数据
	 */
	async getAll(): Promise<T[]> {
		const table = await this.getTable()
		return table.toArray()
	}

	/**
	 * @description 通过索引查询
	 * @param indexName
	 * @param value
	 */
	async getByIndex(indexName: string, value: IndexableType): Promise<T[]> {
		const table = await this.getTable()
		return table.where(indexName).equals(value).toArray()
	}

	/**
	 * @description 删除数据
	 * @param key
	 */
	async delete(key: IndexableType): Promise<void> {
		const table = await this.getTable()
		await table.delete(key)
	}

	/**
	 * @description 清空表
	 */
	async clear(): Promise<void> {
		const table = await this.getTable()
		await table.clear()
	}

	/**
	 * @description 更新数据
	 * @param key 主键
	 * @param changes 需要更新的字段
	 */
	async update(key: IndexableType, changes: UpdateSpec<T>): Promise<number> {
		const table = await this.getTable()
		return table.update(key, changes)
	}
}
