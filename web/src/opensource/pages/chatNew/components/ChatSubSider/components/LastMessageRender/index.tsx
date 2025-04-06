import type { LastReceiveMessage } from "@/opensource/models/chat/conversation/types"
import { ConversationMessageType } from "@/types/chat/conversation_message"
import { memo } from "react"
import RichText from "../../../ChatMessageList/components/MessageFactory/components/RichText"

interface LastMessageRenderProps {
	message?: LastReceiveMessage
	className?: string
}

const LastMessageRender = memo(function LastMessageRender(props: LastMessageRenderProps) {
	const { message, className } = props

	if (!message) {
		return null
	}

	switch (message.type) {
		case ConversationMessageType.RichText:
			return (
				<RichText
					className={className}
					emojiSize={13}
					content={JSON.parse(message.text)}
					messageId={message.seq_id}
					hiddenDetail
				/>
			)
		default:
			return <div className={className}>{message.text}</div>
	}
})

export default LastMessageRender
