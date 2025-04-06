import type {
	ConversationMessage,
	ConversationMessageSend,
} from "@/types/chat/conversation_message"
import { ConversationMessageType } from "@/types/chat/conversation_message"
import type { SeqResponse } from "@/types/request"
import { useMemo } from "react"

const useMessageReply = (
	message: SeqResponse<ConversationMessage> | ConversationMessageSend | undefined,
) => {
	const canReply = useMemo(() => {
		switch (message?.message.type) {
			case ConversationMessageType.Text:
			case ConversationMessageType.RichText:
			case ConversationMessageType.Markdown:
			case ConversationMessageType.AggregateAISearchCard:
				return true
			default:
				return false
		}
	}, [message])

	return {
		canReply,
	}
}

export default useMessageReply
