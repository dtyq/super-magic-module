import type { RecordSummaryConversationMessage } from "@/types/chat/conversation_message"
import { makeObservable, observable } from "mobx"
import { Local } from "@/stores/teamshare/Storage"
import chatDb from "@/opensource/database/chat"
import { userStore } from "@/opensource/models/user"

type MessageQueueItem = {
	message: Pick<RecordSummaryConversationMessage, "type" | "recording_summary">
	callFnName: string
	sendTime: number
}

class RecordSummaryManager {
	messageQueue: MessageQueueItem[] = []

	// eslint-disable-next-line class-methods-use-this
	get isRecordingKey() {
		return `${userStore.user.userInfo?.magic_id || "default"}_isRecording`
	}

	isRecording: boolean = false

	constructor() {
		makeObservable(this, {
			isRecording: observable,
		})
		this.isRecording = JSON.parse(Local.get(this.isRecordingKey) || "false")
	}

	updateIsRecording(bool: boolean) {
		this.isRecording = bool
		Local.set(this.isRecordingKey, bool)
	}

	addToMessageQueue(message: MessageQueueItem) {
		this.messageQueue.push(message)
		// 存到 db 中
		chatDb.db?.record_summary_message_queue.add(message)
	}
}

export default new RecordSummaryManager()
