import type { LastReceiveMessage } from "@/opensource/models/chat/conversation/types"
import { ConversationMessageType } from "@/types/chat/conversation_message"
import { memo } from "react"
import RichText from "../../../ChatMessageList/components/MessageFactory/components/RichText"
import { createStyles } from "antd-style"
import { jsonParse } from "@/utils/string"

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

const LastMessageRender = memo(
	function LastMessageRender(props: LastMessageRenderProps) {
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
						content={jsonParse(message.text, {
							doc: [
								{
									type: "paragraph",
									content: [{ type: "text", text: message.text }],
								},
							],
						})}
						messageId={message.seq_id}
						hiddenDetail
					/>
				)
			default:
				return <div className={className}>{message.text}</div>
		}
	},
	(prevProps, nextProps) => {
		return (
			prevProps.message?.seq_id === nextProps.message?.seq_id &&
			prevProps.message?.type === nextProps.message?.type &&
			prevProps.message?.text === nextProps.message?.text
		)
	},
)

export default LastMessageRender
