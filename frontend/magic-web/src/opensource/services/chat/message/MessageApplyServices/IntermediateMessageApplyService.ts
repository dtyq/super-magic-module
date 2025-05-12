import type { IntermediateResponse, SeqResponse } from "@/types/request"
import { IntermediateMessageType, IntermediateMessage } from "@/types/chat/intermediate_message"
import ConversationService from "@/opensource/services/chat/conversation/ConversationService"

class IntermediateMessageApplyService {
	/**
	 * 应用消息
	 * @param message 消息对象
	 */
	apply(message: IntermediateResponse) {
		switch (message.seq.message.type) {
			case IntermediateMessageType.StartConversationInput:
				this.applyStartConversationInputMessage(message.seq)
				break
			case IntermediateMessageType.EndConversationInput:
				this.applyEndConversationInputMessage(message.seq)
				break
		}
	}

	/**
	 * 应用开始会话输入消息
	 * @param message 消息对象
	 */
	applyStartConversationInputMessage(message: SeqResponse<IntermediateMessage>) {
		ConversationService.startConversationInput(message.conversation_id)
	}

	/**
	 * 应用结束会话输入消息
	 * @param message 消息对象
	 */
	applyEndConversationInputMessage(message: SeqResponse<IntermediateMessage>) {
		ConversationService.endConversationInput(message.conversation_id)
	}
}

export default new IntermediateMessageApplyService()
