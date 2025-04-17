import { Skeleton } from "antd"
import { Suspense } from "react"
import type {
	ConversationMessage,
	ConversationMessageSend,
} from "@/types/chat/conversation_message"
import { ConversationMessageType } from "@/types/chat/conversation_message"
import { observer } from "mobx-react-lite"
import MessageFactory from "./MessageFactory"
import ConversationMessageProvider from "../MessageItem/components/ConversationMessageProvider"
import { createStyles } from "antd-style"

const useStyles = createStyles(() => ({
	messageContent: {
		width: "fit-content",
		maxWidth: "100%",
	},
}))

const MessageRenderer = observer(
	({
		type,
		message,
		isSelf,
		messageId,
		referFileId,
	}: {
		type: ConversationMessageType
		message: ConversationMessage | ConversationMessageSend["message"]
		isSelf: boolean
		messageId: string
		referMessageId?: string
		referFileId?: string
	}) => {
		const { styles, cx } = useStyles()
		const MessageComponent = MessageFactory.getComponent(type)

		if (!MessageComponent) {
			return null
		}

		const parsedContent = MessageFactory.parseContent(type, message)
		const parsedReasoningContent = MessageFactory.parseReasoningContent(
			type,
			message as ConversationMessage,
		)
		const isStreaming = MessageFactory.parseIsStreaming(type, message as ConversationMessage)
		const isReasoningStreaming = MessageFactory.parseIsReasoningStreaming(
			type,
			message as ConversationMessage,
		)
		const parsedFiles = MessageFactory.parseFiles(type, message, referFileId)
		let FileComponent = null
		if (type !== ConversationMessageType.Files) {
			FileComponent = MessageFactory.getFileComponent()
		}

		return (
			<div className={cx(styles.messageContent, "message-content")}>
				<Suspense fallback={<Skeleton.Input active />}>
					<ConversationMessageProvider messageId={messageId}>
						<MessageComponent
							files={parsedFiles}
							content={parsedContent}
							reasoningContent={parsedReasoningContent}
							messageId={messageId}
							isSelf={isSelf}
							isStreaming={isStreaming}
							isReasoningStreaming={isReasoningStreaming}
						/>
						{type !== ConversationMessageType.Files && FileComponent && (
							<FileComponent files={parsedFiles} messageId={messageId} />
						)}
					</ConversationMessageProvider>
				</Suspense>
			</div>
		)
	},
)

export default MessageRenderer
