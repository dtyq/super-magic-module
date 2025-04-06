import { ConversationGroupKey } from "@/const/chat"
import type Conversation from "@/opensource/models/chat/conversation"
import { MessageReceiveType } from "@/types/chat"
import type { ConversationFromService } from "@/types/chat/conversation"
import type { ConversationMessage } from "@/types/chat/conversation_message"
import { ConversationMessageType } from "@/types/chat/conversation_message"
import { t } from "i18next"

/**
 * 获取会话组
 * @param item 会话
 * @returns 会话组
 */
export const getConversationGroupKey = (item: Conversation | ConversationFromService) => {
	switch (item.receive_type) {
		case MessageReceiveType.User:
			return ConversationGroupKey.User
		case MessageReceiveType.Ai:
			return ConversationGroupKey.AI
		case MessageReceiveType.Group:
			return ConversationGroupKey.Group
		default:
			return ConversationGroupKey.Other
	}
}

/**
 * 获取消息文本
 * @param message 消息
 * @returns 消息文本
 */
export const getSlicedText = (message: ConversationMessage) => {
	switch (message.type) {
		case ConversationMessageType.Text:
			return (message.text?.content ?? "").slice(0, 50)
		case ConversationMessageType.RichText:
			return message.rich_text?.content ?? ""
		case ConversationMessageType.Markdown:
			return (message.markdown?.content ?? "").slice(0, 50)
		case ConversationMessageType.AggregateAISearchCard:
			return (
				message.aggregate_ai_search_card?.llm_response ??
				t("chat.messageTextRender.aggregate_ai_search_card", { ns: "interface" })
			).slice(0, 50)
		case ConversationMessageType.MagicSearchCard:
			return t("chat.messageTextRender.magic_search_card", { ns: "interface" })
		case ConversationMessageType.Files:
			return t("chat.messageTextRender.files", { ns: "interface" })
		case ConversationMessageType.AiImage:
		case ConversationMessageType.HDImage:
			return t("chat.messageTextRender.ai_image", { ns: "interface" })
		default:
			return ""
	}
}
