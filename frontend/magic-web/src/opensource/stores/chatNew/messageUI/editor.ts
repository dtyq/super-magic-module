import { makeAutoObservable } from "mobx"

class EditorStore {
	lastConversationId = ""

	lastTopicId = ""

	constructor() {
		makeAutoObservable(this)
	}

	setLastConversationId(conversationId: string) {
		this.lastConversationId = conversationId
	}

	setLastTopicId(topicId: string) {
		this.lastTopicId = topicId
	}
}

export default new EditorStore()
