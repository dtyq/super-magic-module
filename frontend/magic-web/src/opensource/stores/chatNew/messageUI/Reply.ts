import { makeAutoObservable } from "mobx"
import type { FullMessage } from "@/types/chat/message"

class ReplyStore {
	replyMessageId: string | undefined = undefined

	replyMessage: FullMessage | undefined = undefined

	replyFile:
		| {
				fileId: string | undefined
				referText: string | undefined
		  }
		| undefined = undefined

	constructor() {
		makeAutoObservable(this)
	}

	setReplyMessage(messageId: string, message: FullMessage) {
		this.replyMessageId = messageId
		this.replyMessage = message
		console.log("setReplyMessage", this.replyMessageId, this.replyMessage)
	}

	resetReplyMessage() {
		this.replyMessageId = undefined
		this.replyMessage = undefined
	}

	setReplyFile(fileId: string, referText: string) {
		this.replyFile = {
			fileId,
			referText,
		}
	}

	resetReplyFile() {
		this.replyFile = undefined
	}
}

export default new ReplyStore()
