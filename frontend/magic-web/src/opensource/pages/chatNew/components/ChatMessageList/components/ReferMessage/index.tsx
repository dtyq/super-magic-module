import { useContactStore } from "@/opensource/stores/contact/hooks"
import { ConversationMessageType } from "@/types/chat/conversation_message"
import { Flex } from "antd"
import { type PropsWithChildren } from "react"
import { observer } from "mobx-react-lite"
import ReplyStore from "@/opensource/stores/chatNew/messageUI/Reply"
import MessageTextRender from "../MessageTextRender"
import { useStyles } from "./styles"

interface ReferMessageProps extends PropsWithChildren {
	isSelf: boolean
	className?: string
	onClick?: (e: React.MouseEvent<HTMLDivElement>) => void
}

function MessageReferComponent({ isSelf, className, onClick }: ReferMessageProps) {
	const { styles, cx } = useStyles({ isSelf })
	const referFileId = ReplyStore.replyFile?.fileId
	const referText = ReplyStore.replyFile?.referText
	const referMessage = ReplyStore.replyMessage

	const sender = useContactStore((state) =>
		referMessage ? state.userInfos.get(referMessage.sender_id) : undefined,
	)

	if (!referMessage) return null

	if (referMessage.type === ConversationMessageType.AiImage && !referFileId) {
		return null
	}

	return (
		<Flex vertical className={cx(styles.container, className)} gap={2} onClick={onClick}>
			<span className={styles.username}>{sender?.nickname}</span>
			<div className={styles.content}>
				<MessageTextRender
					messageId={referMessage.message_id}
					message={referMessage.message}
					referFileId={referFileId}
					referText={referText}
				/>
			</div>
		</Flex>
	)
}

const MessageRefer = observer(MessageReferComponent)

export default MessageRefer
