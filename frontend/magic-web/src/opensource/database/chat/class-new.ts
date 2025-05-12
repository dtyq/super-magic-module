/* eslint-disable class-methods-use-this */
import { platformKey } from "@/utils/storage"
import Dexie from "dexie"
import { ChatDb } from "./types"

export const ChatDbSchemaStorageKey = (magicId: string) => platformKey(`chat-db-schema/${magicId}`)

/**
 * 聊天数据库
 */
class ChatDatabase {
	db: ChatDb

	magicId: string | undefined

	constructor() {
		this.db = new Dexie(this.getLocalSchemaKey("default")) as ChatDb
		const { version, schema } = this.getLocalDbSchema("default")
		this.db.version(version).stores(schema)
	}

	switchDb(magicId: string) {
		this.magicId = magicId
		this.db = new Dexie(this.getLocalSchemaKey(magicId)) as ChatDb
		const { version, schema } = this.getLocalDbSchema(magicId)
		this.db.version(version).stores(schema)
	}

	/**
	 * 更新数据库 schema
	 * @param schemaChanges 数据库 schema 变更
	 * @returns
	 */
	async changeSchema(schemaChanges: Record<string, string>) {
		if (!this.db || !this.magicId) return undefined

		try {
			const oldDb = this.db
			const newDb = new Dexie(oldDb.name)

			newDb.on("blocked", () => false)

			// Workaround: If DB is empty from tables, it needs to be recreated
			if (this.db.tables.length === 0) {
				await this.db.delete()
				newDb.version(1).stores(schemaChanges)
				return (await newDb.open()) as ChatDb
			}

			// Extract current schema in dexie format:
			const currentSchema = this.db.tables.reduce((result, { name, schema }) => {
				// @ts-ignore
				result[name] = [
					`&${schema.primKey.src}`,
					...schema.indexes.map((idx) => idx.src),
				].join(", ")
				return result
			}, {})

			// 保存旧的数据库引用，以便回滚
			const previousDb = this.db

			try {
				// Tell Dexie about current schema:
				newDb.version(previousDb.verno).stores(currentSchema)
				// Tell Dexie about next schema:
				newDb.version(previousDb.verno + 1).stores({
					...currentSchema,
					...schemaChanges,
				})

				// 先尝试打开新数据库
				await newDb.open()

				// 成功后再关闭旧数据库
				oldDb.close()

				// set schema
				this.setLocalDbSchema(
					{
						version: previousDb.verno + 1,
						schema: {
							...currentSchema,
							...schemaChanges,
						},
					},
					this.magicId,
				)

				this.db = newDb as ChatDb
				return this.db
			} catch (error) {
				// 如果升级失败，关闭新数据库并保持使用旧数据库
				await newDb.close()
				throw error
			}
		} catch (error) {
			console.error("Schema change failed:", error)
			throw new Error("Failed to update database schema")
		}
	}

	/**
	 * 本地数据库 schema 的 key
	 */
	getLocalSchemaKey(magicId: string) {
		return ChatDbSchemaStorageKey(magicId)
	}

	get defaultSchema() {
		return {
			conversation: "&id, user_organization_code",
			conversation_dots: "&conversation_id",
			organization_dots: "&organization_code",
			topic_dots: "&conversation_topic_id",
			pending_messages: "&message_id",
			disband_group_unconfirm: "&conversation_id",
			file_urls: "&file_id",
			current_conversation_id: "&organization_code",
			record_summary_message_queue: "&send_time",
			text_avatar_cache: "&text",
			topic_list: "&conversation_id",
			editor_draft: "&key, topic_id, conversation_id",
		}
	}

	/**
	 * 获取消息表的默认schema
	 * @param conversationId 会话ID
	 * @returns 消息表schema
	 */
	getMessageTableSchema() {
		return `&seq_id, message.topic_id, [message.topic_id+message.send_time], message.send_time, message.type, [message.type+message.topic_id]`
	}

	/**
	 * 获取本地数据库的 schema
	 * @returns
	 */
	getLocalDbSchema(magicId: string) {
		return JSON.parse(
			localStorage.getItem(this.getLocalSchemaKey(magicId)) ||
				JSON.stringify({ version: 1, schema: this.defaultSchema }),
		)
	}

	/**
	 * 缓存本地数据库的 schema，用于下次打开时恢复
	 * @param schema
	 */
	setLocalDbSchema(schema: { version: number; schema: Record<string, string> }, magicId: string) {
		localStorage.setItem(this.getLocalSchemaKey(magicId), JSON.stringify(schema))
	}

	/**
	 * 获取会话表
	 * @returns 会话表
	 */
	getConversationTable() {
		if (!this.db?.conversation) {
			this.changeSchema({
				conversation: this.defaultSchema.conversation,
			})
		}
		return this.db?.conversation
	}

	getTopicListTable() {
		if (!this.db?.topic_list) {
			this.changeSchema({
				topic_list: this.defaultSchema.topic_list,
			})
		}
		return this.db?.topic_list
	}

	getFileUrlsTable() {
		if (!this.db?.file_urls) {
			this.changeSchema({
				file_urls: this.defaultSchema.file_urls,
			})
		}
		return this.db?.file_urls
	}

	getTextAvatarTable() {
		if (!this.db?.text_avatar_cache) {
			this.changeSchema({
				text_avatar_cache: "&text",
			})
		}
		return this.db?.text_avatar_cache
	}

	getEditorDraftTable() {
		if (!this.db?.editor_draft) {
			this.changeSchema({
				editor_draft: this.defaultSchema.editor_draft,
			})
		}
		return this.db?.editor_draft
	}
}

export default ChatDatabase
