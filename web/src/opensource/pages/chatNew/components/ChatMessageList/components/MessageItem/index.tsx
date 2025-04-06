import { memo, useMemo } from "react"
import { Flex } from "antd"
import { cx } from "antd-style"
import type {
	ConversationMessage,
	ConversationMessageSend,
} from "@/types/chat/conversation_message"
import { ConversationMessageType } from "@/types/chat/conversation_message"
import { calculateRelativeSize } from "@/utils/styles"
import { getAvatarUrl } from "@/utils/avatar"
import { useFontSize } from "@/opensource/providers/AppearanceProvider/hooks"
import MessageContent from "./components/MessageContent"
// import MessageStatus from "./components/MessageStatus"
import MessageSeenStatus from "../MessageSeenStatus"
import MessageSendStatus from "../MessageSendStatus"
import useStyles from "./style"
import MagicAvatar from "@/opensource/components/base/MagicAvatar"
import MemberCardStore from "@/opensource/stores/display/MemberCardStore"

interface MessageItemProps {
	message_id: string
	sender_id: string
	name: string
	avatar: string
	is_self: boolean
	message: ConversationMessage | ConversationMessageSend["message"]
	status?: string
	unread_count?: number
	conversation?: any
	className?: string
	refer_message_id?: string
}

// 头像独立，避免重复渲染
const Avatar = memo(
	function Avatar({
		name,
		avatar,
		size,
		uid,
	}: {
		name: string
		avatar: string
		size: number
		uid: string
	}) {
		// 使用 useMemo 缓存 info 对象，避免每次渲染都创建新对象
		const info = useMemo(() => ({ name, avatar_url: getAvatarUrl(avatar) }), [name, avatar])

		return (
			<MagicAvatar
				src={info.avatar_url}
				size={size}
				onClick={(e: any) => {
					if (e) {
						MemberCardStore.openCard(uid, { x: e.clientX, y: e.clientY })
					}
					e.stopPropagation()
					e.preventDefault()
				}}
			>
				{name}
			</MagicAvatar>
		)
	},
	(prevProps, nextProps) =>
		prevProps.name === nextProps.name &&
		prevProps.avatar === nextProps.avatar &&
		prevProps.size === nextProps.size,
)

const MessageItem = memo(function MessageItem({
	message_id,
	name,
	avatar,
	is_self,
	message,
	unread_count,
	className,
	sender_id,
	refer_message_id,
}: MessageItemProps) {
	const { fontSize } = useFontSize()
	const isBlockMessage = message.type === ConversationMessageType.RecordingSummary
	const { styles } = useStyles({ fontSize: 16, isMultipleCheckedMode: false })

	// 使用 useMemo 缓存样式计算
	const containerStyle = useMemo(
		() => ({
			marginTop: `${calculateRelativeSize(12, fontSize)}px`,
		}),
		[fontSize],
	)

	// 使用 useMemo 缓存头像大小
	const avatarSize = useMemo(() => calculateRelativeSize(40, fontSize), [fontSize])

	// 使用 useMemo 缓存头像组件
	const avatarComponent = <Avatar name={name} avatar={avatar} size={avatarSize} uid={sender_id} />

	return (
		<div
			id={message_id}
			className={cx(
				styles.flexContainer,
				styles.container,
				isBlockMessage && styles.blockContainer,
				className,
			)}
			style={{ ...containerStyle, justifyContent: is_self ? "flex-end" : "flex-start" }}
			data-message-id={message_id}
		>
			{/* 头像 - 非本人消息显示在左侧 */}
			{!is_self && avatarComponent}

			{/* 消息内容和状态 */}
			<Flex vertical gap={4}>
				<MessageContent
					message_id={message_id}
					message={message}
					is_self={is_self}
					refer_message_id={refer_message_id}
					name={name}
				/>
				{is_self && (
					<>
						<MessageSeenStatus unreadCount={unread_count ?? 0} messageId={message_id} />
						<MessageSendStatus messageId={message_id} />
					</>
				)}
			</Flex>

			{/* 头像 - 本人消息显示在右侧 */}
			{is_self && avatarComponent}
		</div>
	)
})

export default MessageItem
