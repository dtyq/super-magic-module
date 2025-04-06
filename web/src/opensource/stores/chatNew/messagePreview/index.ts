import { makeAutoObservable } from "mobx"
import MessageStore from "@/opensource/stores/chatNew/message"
import type { FullMessage } from "@/types/chat/message"
import type { ConversationMessage } from "@/types/chat/conversation_message"
import type { PreviewFileInfo } from "@/opensource/services/chat/message/MessageFilePreview"

class MessagePreviewStore {
	previewInfo: PreviewFileInfo | undefined = undefined

	open: boolean = false

	message: FullMessage<ConversationMessage> | undefined

	constructor() {
		makeAutoObservable(this)
	}

	setPreviewInfo(info: PreviewFileInfo) {
		this.previewInfo = { ...info }
		if (info.messageId) {
			this.message = MessageStore.getMessage(info.messageId)
		} else {
			this.message = undefined
		}
		this.setOpen(true)
	}

	clearPreviewInfo() {
		this.previewInfo = undefined
		this.setOpen(false)
	}

	setOpen(open: boolean) {
		this.open = open
	}
}

export default new MessagePreviewStore()
