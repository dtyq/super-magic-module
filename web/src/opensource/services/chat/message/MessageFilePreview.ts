/* eslint-disable class-methods-use-this */
import MessagePreviewStore from "@/opensource/stores/chatNew/messagePreview"
import ConversationStore from "@/opensource/stores/chatNew/conversation"
import type { FileTypeResult } from "file-type"

/** 预览文件信息 */
export type PreviewFileInfo = {
	messageId: string | undefined
	conversationId: string | undefined
	fileId?: string
	// 原图文件id
	oldFileId?: string
	// 原图文件url
	oldUrl?: string
	fileName?: string
	fileSize?: number
	index?: number
	url?: string
	ext?:
		| Partial<FileTypeResult>
		| { ext?: "svg"; mime?: "image/svg+xml" }
		| { ext?: string; mime?: string }
	/** 是否独立显示 */
	standalone?: boolean
	/** 是否使用转高清功能 */
	useHDImage?: boolean
}

class MessageFilePreview {
	setPreviewInfo(info: PreviewFileInfo, useHDImage: boolean = false) {
		if (!info.messageId || !info.url) return
		info.conversationId = ConversationStore.currentConversation?.id

		MessagePreviewStore.setPreviewInfo({ ...info, useHDImage })
	}

	clearPreviewInfo() {
		MessagePreviewStore.clearPreviewInfo()
	}
}

export default new MessageFilePreview()
