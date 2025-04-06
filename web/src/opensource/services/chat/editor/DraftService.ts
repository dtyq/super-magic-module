/* eslint-disable class-methods-use-this */
import EditorDraftStore from "@/opensource/stores/chatNew/editorDraft"

class DraftService {
	// 写入草稿
	writeDraft(conversationId: string, topicId: string, draft: any) {
		EditorDraftStore.setDraft(conversationId, topicId, draft)
	}

	// 删除草稿
	deleteDraft(conversationId: string, topicId: string) {
		EditorDraftStore.deleteDraft(conversationId, topicId)
	}
}

export default new DraftService()
