// 消息编辑草稿
import { makeAutoObservable } from "mobx"

class EditorDraftStore {
	draftMap = new Map<string, any>()

	constructor() {
		makeAutoObservable(this, {}, { autoBind: true })
	}

	hasDraft(conversationId: string, topicId: string) {
		return this.draftMap.has(`${conversationId}-${topicId}`)
	}

	// 获取草稿
	getDraft(conversationId: string, topicId: string) {
		return this.draftMap.get(`${conversationId}-${topicId}`)
	}

	// 设置草稿
	setDraft(conversationId: string, topicId: string, draft: any) {
		this.draftMap.set(`${conversationId}-${topicId}`, draft)
	}

	// 删除草稿
	deleteDraft(conversationId: string, topicId: string) {
		this.draftMap.delete(`${conversationId}-${topicId}`)
	}
}

export default new EditorDraftStore()
