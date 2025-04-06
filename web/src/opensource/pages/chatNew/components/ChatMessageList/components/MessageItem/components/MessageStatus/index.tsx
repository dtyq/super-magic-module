import { memo, useMemo } from "react"
import { Flex } from "antd"
import { observer } from "mobx-react-lite"
import MessageStore from "@/opensource/stores/chatNew/message"
import { ConversationMessageStatus, SendStatus } from "@/types/chat/conversation_message"
import MessageSeenStatus from "../../../MessageSeenStatus"
import MessageSendStatus from "../../../MessageSendStatus"
import { useStyles } from "./style"

interface MessageStatusProps {
	message_id: string
	unread_count?: number
}

// 将 StatusContainer 组件抽离并使用 memo
const StatusContainer = memo(({ children }: { children: React.ReactNode }) => {
	const { styles } = useStyles()
	return (
		<Flex vertical className={styles.container}>
			{children}
		</Flex>
	)
})

// 将 StatusContent 组件抽离并使用 memo
const StatusContent = memo(
	({
		message_id,
		unread_count,
	}: {
		message_id: string
		unread_count: number
		seenStatus: ConversationMessageStatus
		sendStatus: SendStatus
	}) => (
		<>
			<MessageSeenStatus unreadCount={unread_count} messageId={message_id} />
			<MessageSendStatus messageId={message_id} />
		</>
	),
	(prevProps, nextProps) =>
		prevProps.message_id === nextProps.message_id &&
		prevProps.unread_count === nextProps.unread_count,
)

const MessageStatus = ({ message_id, unread_count = 0 }: MessageStatusProps) => {
	// 使用 useMemo 缓存状态
	const seenStatus = useMemo(
		() => MessageStore.seenStatusMap.get(message_id) ?? ConversationMessageStatus.Unread,
		[message_id],
	)

	const sendStatus = useMemo(
		() => MessageStore.sendStatusMap.get(message_id) ?? SendStatus.Pending,
		[message_id],
	)

	return (
		<StatusContainer>
			<StatusContent
				message_id={message_id}
				unread_count={unread_count}
				seenStatus={seenStatus}
				sendStatus={sendStatus}
			/>
		</StatusContainer>
	)
}

// 使用 memo 包装 observer，并添加比较函数
export default memo(
	observer(MessageStatus),
	(prevProps, nextProps) =>
		prevProps.message_id === nextProps.message_id &&
		prevProps.unread_count === nextProps.unread_count,
)
