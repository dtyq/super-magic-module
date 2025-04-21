import { makeAutoObservable } from "mobx"
import MessageStore from "@/opensource/stores/chatNew/message"
import type { FullMessage } from "@/types/chat/message"
import type { ConversationMessage } from "@/types/chat/conversation_message"
import type { PreviewFileInfo } from "@/opensource/services/chat/message/MessageFilePreview"
import { SeqResponse } from "@/types/request"
import { MenuItemGroupType } from "antd/es/menu/interface"
import { TFunction } from "i18next"

class MessagePreviewStore {
	/**
	 * 预览信息
	 */
	previewInfo: PreviewFileInfo | undefined = undefined

	/**
	 * 预览窗口是否打开
	 */
	open: boolean = false

	/**
	 * 消息
	 */
	message: FullMessage<ConversationMessage> | SeqResponse<ConversationMessage> | undefined

	constructor() {
		makeAutoObservable(this, {}, { autoBind: true })
	}

	/**
	 * 设置预览信息
	 * @param info 预览信息
	 */
	setPreviewInfo(info: PreviewFileInfo) {
		this.previewInfo = { ...info }
		if (info.messageId) {
			this.message = MessageStore.getMessage(info.messageId)
		} else {
			this.message = undefined
		}
		this.setOpen(true)
	}

	/**
	 * 清除预览信息
	 */
	clearPreviewInfo() {
		this.previewInfo = undefined
		this.setOpen(false)
	}

	/**
	 * 设置预览窗口是否打开
	 * @param open 是否打开
	 */
	setOpen(open: boolean) {
		this.open = open
	}
}

export default new MessagePreviewStore()
