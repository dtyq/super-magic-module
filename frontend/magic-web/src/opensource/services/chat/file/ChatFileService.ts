import { groupBy } from "lodash-es"
import type { ChatFileUrlData } from "@/types/chat/conversation_message"
import { makeObservable, observable } from "mobx"
import chatDb from "@/opensource/database/chat"
import { ChatApi } from "@/apis"

interface FileCacheData extends ChatFileUrlData {
	file_id: string
	message_id: string
	url: string
	expires: number
}

/**
 * 聊天文件业务
 */
class ChatFileService {
	fileInfoCache: Map<string, FileCacheData>

	constructor() {
		this.fileInfoCache = new Map()
		makeObservable(this, {
			fileInfoCache: observable,
		})
	}

	/**
	 * 初始化
	 */
	init() {
		chatDb
			?.getFileUrlsTable()
			?.toArray()
			.then((res) => {
				this.fileInfoCache = new Map(res.map((item) => [item.file_id, item]))
			})
	}

	/**
	 * 获取文件信息缓存
	 */
	getFileInfoCache(fileId?: string) {
		if (!fileId) return undefined
		return this.fileInfoCache.get(fileId)
	}

	/**
	 * 缓存文件信息
	 */
	cacheFileUrl(fileInfo: ChatFileUrlData & { file_id: string; message_id: string }) {
		this.fileInfoCache.set(fileInfo.file_id, fileInfo)
		chatDb
			?.getFileUrlsTable()
			?.get(fileInfo.file_id)
			.then((res) => {
				if (res) {
					chatDb?.getFileUrlsTable()?.update(fileInfo.file_id, fileInfo)
				} else {
					chatDb?.getFileUrlsTable()?.add(fileInfo)
				}
			})
	}

	/**
	 * 获取文件信息
	 */
	fetchFileUrl(
		datas?: { file_id: string; message_id: string }[],
	): Promise<Record<string, FileCacheData>> {
		if (!datas || !datas.length) return Promise.resolve({})

		// 检测是否过期
		const { true: expired = [], false: notExpired = [] } = groupBy(datas, (item) => {
			const fileInfo = this.fileInfoCache.get(item.file_id)
			if (!fileInfo) return true
			return fileInfo.expires * 1000 < Date.now()
		})

		if (expired.length > 0) {
			const messageIdMap = new Map(datas.map((item) => [item.file_id, item.message_id]))
			return ChatApi.getChatFileUrls(expired).then((res) => {
				const resArray = Object.entries(res)
				for (let i = 0; i < resArray.length; i += 1) {
					const [fileId, fileInfo] = resArray[i]
					this.cacheFileUrl({
						...fileInfo,
						file_id: fileId,
						message_id: messageIdMap.get(fileId) || "",
					})
				}

				// 返回文件信息
				return datas.reduce(
					(acc, item) => {
						acc[item.file_id] = this.fileInfoCache.get(item.file_id)!
						return acc
					},
					{} as Record<string, FileCacheData>,
				)
			})
		}

		return Promise.resolve(
			notExpired.reduce(
				(acc, item) => {
					acc[item.file_id] = this.fileInfoCache.get(item.file_id)!
					return acc
				},
				{} as Record<string, FileCacheData>,
			),
		)
	}
}

export default new ChatFileService()
