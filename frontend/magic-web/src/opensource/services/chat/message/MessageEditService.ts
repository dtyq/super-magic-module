class MessageEditService {
	messageId: string = ""

	setEditMessageId(messageId: string) {
		this.messageId = messageId
	}

	resetEditMessageId() {
		this.messageId = ""
	}
}

export default new MessageEditService()
