import { memo, useMemo } from "react"
import type { ConversationMessage } from "@/types/chat/conversation_message"
import { ConversationMessageType } from "@/types/chat/conversation_message"
import { useTranslation } from "react-i18next"
import { isConversationMessage } from "@/utils/chat/message"
import MagicAvatar from "@/opensource/components/base/MagicAvatar"
import MagicMarkdown from "@/opensource/pages/chatNew/components/ChatMessageList/components/MessageFactory/components/Markdown/EnhanceMarkdown"
import { Flex } from "antd"
import useChatFileUrls from "@/opensource/hooks/chat/useChatFileUrls"
import { ControlEventMessageType } from "@/types/chat/control_message"
import RichText from "../MessageFactory/components/RichText"
import { useStyles } from "./styles"
import RevokeTip from "../RevokeTip"
import { jsonParse } from "@/utils/string"

const sliceMessageText = (message: string) => {
	if (message.length > 100) {
		return `${message.slice(0, 100)}...`
	}
	return message
}

interface ConversationMessageTextRenderProps {
	message?: ConversationMessage
	messageId?: string
	referFileId?: string
	referText?: string
	skipRevoked?: boolean
	lineClamp?: number | false
	className?: string
}

const MessageTextRender = memo(function MessageTextRender({
	message,
	messageId,
	referFileId,
	referText,
	skipRevoked,
	lineClamp = 1,
	className,
}: ConversationMessageTextRenderProps) {
	const { t } = useTranslation("interface")
	const { styles, cx } = useStyles({ lineClamp })

	const { data: urls } = useChatFileUrls(
		useMemo(
			() =>
				messageId && referFileId
					? [
							{
								message_id: messageId,
								file_id: referFileId,
							},
					  ]
					: [],
			[messageId, referFileId],
		),
	)

	// 文生图应用url
	const referImgUrl = useMemo(
		() => (referFileId ? urls?.[referFileId]?.url : ""),
		[referFileId, urls],
	)

	// 文生图应用文本
	const referImgText = useMemo(() => {
		if (referText) return referText
		switch (message?.type) {
			case ConversationMessageType.AiImage:
				return message?.ai_image_card?.refer_text
			case ConversationMessageType.HDImage:
				return message?.image_convert_high_card?.refer_text
			default:
				return ""
		}
	}, [referText, message])

	if (!message || !isConversationMessage(message)) return null

	// 如果消息被撤回，则显示撤回提示
	if (!skipRevoked && message.revoked) return t("chat.messageRevoked")

	switch (message.type) {
		case ConversationMessageType.Text:
			return (
				<MagicMarkdown
					className={cx(styles.content, className)}
					content={sliceMessageText(message.text?.content ?? "")}
					hiddenDetail
				/>
			)
		case ConversationMessageType.RichText:
			if (!messageId) return null
			return (
				<RichText
					messageId={messageId}
					className={cx(styles.content, className)}
					content={jsonParse(message.rich_text?.content ?? "{}", {})}
					hiddenDetail
				/>
			)
		case ConversationMessageType.Markdown:
			return (
				<MagicMarkdown
					className={cx(styles.content, className)}
					content={sliceMessageText(message.markdown?.content ?? "")}
					hiddenDetail
				/>
			)
		case ControlEventMessageType.RevokeMessage:
			return <RevokeTip senderUid={message.sender_id} />
		case ConversationMessageType.AggregateAISearchCard:
			if (!message.aggregate_ai_search_card?.llm_response) {
				return (
					<span className={cx(styles.content, className)}>
						{t("chat.messageTextRender.aggregate_ai_search_card")}
					</span>
				)
			}
			return (
				<MagicMarkdown
					className={cx(styles.content, className)}
					content={sliceMessageText(message.aggregate_ai_search_card?.llm_response ?? "")}
					hiddenDetail
				/>
			)
		case ConversationMessageType.MagicSearchCard:
			return t("chat.messageTextRender.magic_search_card")
		case ConversationMessageType.Files:
			return t("chat.messageTextRender.files")
		case ConversationMessageType.AiImage:
		case ConversationMessageType.HDImage:
			return referImgUrl ? (
				<Flex gap={4} align="center">
					<MagicAvatar src={referImgUrl} size={30} shape="square" />
					<span className={styles.aiImageText}>{referImgText}</span>
				</Flex>
			) : (
				t("chat.messageTextRender.ai_image")
			)
		default:
			return null
	}
})

export default MessageTextRender
