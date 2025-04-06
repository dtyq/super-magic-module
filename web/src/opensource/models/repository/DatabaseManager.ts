import Dexie from "dexie"
import type { TableSchema } from "./types"

interface IStoreConfigs {
	name: string
	options: IDBObjectStoreParameters
	indexes: Array<{
		name: string
		keyPath: Array<string> | string
		options: IDBIndexParameters
	}>
}

interface DBConfig {
	version: number
	stores: IStoreConfigs[]
}

/**
 * ======================== 数据库表定义 ========================
 */
const enum TableName {
	Message = "message",
	Rooms = "rooms",
}

// 数据库配置示例
// @ts-ignore
const DEFAULT_DB_CONFIG: DBConfig = {
	version: 1,
	stores: [
		{
			name: TableName.Message,
			options: { keyPath: "id", autoIncrement: false },
			indexes: [{ name: "email", keyPath: "email", options: { unique: true } }],
		},
		{
			name: TableName.Rooms,
			options: { keyPath: "roomId", autoIncrement: true },
			indexes: [
				{ name: "roomId", keyPath: "roomId", options: { unique: false } },
				{ name: "content", keyPath: "content", options: { unique: false } },
				{ name: "updatedAt", keyPath: "updatedAt", options: { unique: false } },
			],
		},
	],
}

// 数据库配置示例
// @ts-ignore
const GLOBAL_DB_CONFIG: DBConfig = {
	version: 1,
	stores: [
		{
			name: "config",
			options: { keyPath: "id", autoIncrement: false },
			indexes: [{ name: "email", keyPath: "email", options: { unique: true } }],
		},
	],
}

export class DatabaseManager {
	private static instance: DatabaseManager

	private databases: Map<string, Dexie> = new Map()

	private globalDatabase: Dexie | undefined

	// private tableSchemas: Map<string, TableSchema[]> = new Map()

	private constructor() {
		// 私有构造函数
	}

	public static getInstance(): DatabaseManager {
		if (!DatabaseManager.instance) {
			DatabaseManager.instance = new DatabaseManager()
		}
		return DatabaseManager.instance
	}

	// /**
	//  * @description 初始化数据库管理器
	//  * @param schemas 数据库表结构定义列表
	//  */
	// public initialize(schemas: TableSchema[]): void {
	// 	if (this.initialized) {
	// 		return
	// 	}

	// 	// 注册全局数据库的表结构
	// 	this.tableSchemas.set("magic-global", schemas)
	// 	this.initialized = true
	// }

	// private updateDatabaseSchema(db: Dexie, schemas: TableSchema[]): void {
	// 	const version = Math.max(...schemas.map((s) => s.version))
	// 	const storeSchema: Record<string, string> = {}

	// 	schemas.forEach(({ name, schema }) => {
	// 		storeSchema[name] = schema
	// 	})

	// 	db.version(version).stores(storeSchema)
	// }

	public async getDatabase(userId: string): Promise<Dexie> {
		const dbName = `magic-user-${userId}`
		const existingDb = this.databases.get(dbName)
		if (existingDb) {
			return existingDb
		}
		const db = await this.initDatabase(dbName, 1, [
			{ name: "config-table", schema: "key, value, enabled, createdAt, updatedAt" },
		])
		this.databases.set(dbName, db)
		return db
	}

	public async getGlobalDatabase(): Promise<Dexie> {
		if (this.globalDatabase) {
			return this.globalDatabase
		}
		const dbName = "magic-global"
		this.globalDatabase = await this.initDatabase(dbName, 1, [
			{ name: "config", schema: "&key, value" },
			{ name: "user", schema: "&key, value" },
			{ name: "account", schema: "&magic_id, deployCode, magic_user_id, organizationCode" },
			{ name: "cluster", schema: "&deployCode, name"}
		])
		return this.globalDatabase
	}

	// eslint-disable-next-line class-methods-use-this
	private async initDatabase(
		dbName: string,
		version: number,
		schemas: TableSchema[],
	): Promise<Dexie> {
		const db = new Dexie(dbName)
		const storeSchema: Record<string, string> = {}

		schemas.forEach(({ name, schema }) => {
			storeSchema[name] = schema
		})

		db.version(version).stores(storeSchema)

		return db
	}
}
