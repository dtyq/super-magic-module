import type { LastReceiveMessage } from "@/opensource/models/chat/conversation/types"
import { ConversationMessageType } from "@/types/chat/conversation_message"
import { memo } from "react"
import RichText from "../../../ChatMessageList/components/MessageFactory/components/RichText"
import { createStyles } from "antd-style"

interface LastMessageRenderProps {
	message?: LastReceiveMessage
	className?: string
}

const useStyles = createStyles(({ css }) => ({
	richText: css`
		p {
			margin: 0;
		}
	`,
}))

const LastMessageRender = memo(function LastMessageRender(props: LastMessageRenderProps) {
	const { message, className } = props
	const { styles, cx } = useStyles()

	if (!message) {
		return null
	}

	switch (message.type) {
		case ConversationMessageType.RichText:
			return (
				<RichText
					className={cx(styles.richText, className)}
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
