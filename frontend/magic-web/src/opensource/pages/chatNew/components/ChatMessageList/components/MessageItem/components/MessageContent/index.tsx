import { useMemo } from "react"
import { Flex } from "antd"
import { cx } from "antd-style"
import type {
	ConversationMessage,
	ConversationMessageSend,
	RichTextConversationMessage,
	TextConversationMessage,
} from "@/types/chat/conversation_message"
import { ConversationMessageType } from "@/types/chat/conversation_message"
import { DomClassName } from "@/const/dom"
import MessageStore from "@/opensource/stores/chatNew/message"
import { observer } from "mobx-react-lite"
import { useFontSize } from "@/opensource/providers/AppearanceProvider/hooks"
import MessageFactory from "../../../MessageFactory"
import { useStyles } from "./style"
import MessageHeader from "./MessageHeader"
import MessageTextRender from "../../../MessageTextRender"
// import EmojiItem from "../EmojiItem"

// import RichText from "../../../MessageFactory/components/RichText"

interface MessageContentProps {
	message_id: string
	message: ConversationMessage | ConversationMessageSend["message"]
	is_self: boolean
	name: string
	refer_message_id?: string
}

type MessageReferContentProps = {
	refer_message_id?: string
	refer_file_id?: string
}

const MessageReferContent = observer(
	({ refer_message_id, refer_file_id }: MessageReferContentProps) => {
		const { fontSize } = useFontSize()
		const { styles } = useStyles({ fontSize })

		const message = useMemo(() => {
			return refer_message_id ? MessageStore.getMessage(refer_message_id) : undefined
		}, [refer_message_id])

		if (!message) return null
		return (
			<div className={styles.referContent}>
				<MessageTextRender
					messageId={refer_message_id}
					message={message.message}
					referFileId={refer_file_id}
				/>
			</div>
		)
	},
)

const MessageContent = observer(
	({ message_id, message, is_self, name, refer_message_id }: MessageContentProps) => {
		const { fontSize } = useFontSize()
		const { styles } = useStyles({ fontSize })

		const referMsgId = useMemo(() => {
			return message?.type === ConversationMessageType.AiImage ||
				message?.type === ConversationMessageType.HDImage
				? ""
				: refer_message_id
		}, [message, refer_message_id])

		const referFileId = useMemo(() => {
			if (
				referMsgId &&
				[ConversationMessageType.Text, ConversationMessageType.RichText].includes(
					message?.type as ConversationMessageType,
				)
			) {
				if (
					message?.type === ConversationMessageType.RichText &&
					(message as RichTextConversationMessage)?.rich_text?.attachments?.length
				) {
					return (message as RichTextConversationMessage)?.rich_text?.attachments?.[0]
						?.file_id
				}

				if (
					message?.type === ConversationMessageType.Text &&
					(message as TextConversationMessage)?.text?.attachments?.length
				) {
					return (message as TextConversationMessage)?.text?.attachments?.[0]?.file_id
				}
			}
			return undefined
		}, [message, referMsgId])

		return (
			<Flex
				vertical
				gap={4}
				align={is_self ? "flex-end" : "flex-start"}
				className={styles.contentWrapper}
			>
				{/* 发送时间和用户名 */}
				<MessageHeader isSelf={is_self} name={name} sendTime={message.send_time} />
				{/* 消息气泡 */}
				<div
					className={cx(
						styles.content,
						is_self ? styles.magicTheme : styles.defaultTheme,
						DomClassName.MESSAGE_ITEM,
					)}
				>
					{refer_message_id && (
						<MessageReferContent
							refer_message_id={referMsgId}
							refer_file_id={referFileId}
						/>
					)}
					<MessageFactory
						type={message.type as ConversationMessageType}
						message={message}
						isSelf={is_self}
						messageId={message_id}
						referMessageId={referMsgId}
						referFileId={referFileId}
					/>
					{/* {message.type === ConversationMessageType.RichText ? (
						<RichText
							content={JSON.parse(message.rich_text?.content ?? "")}
							isSelf={is_self}
							messageId={message_id}
						/>
					) : (
						<TextItem
							content={message.text?.content ?? ""}
							isSelf={is_self}
							messageId={message_id}
						/>
					)} */}
				</div>
			</Flex>
		)
	},
)

export default MessageContent
