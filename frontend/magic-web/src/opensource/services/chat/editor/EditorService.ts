import { ReportFileUploadsResponse } from "@/opensource/apis/modules/file"
import { JSONContent } from "@tiptap/core"
import { message } from "antd"

/** APIs */
import { ChatApi } from "@/apis"

/** Services */
import MessageService from "@/opensource/services/chat/message/MessageService"
import ConversationBotDataService from "@/opensource/services/chat/conversation/ConversationBotDataService"

/** Stores */
import ConversationStore from "@/opensource/stores/chatNew/conversation"
import MessageReplyStore from "@/opensource/stores/chatNew/messageUI/Reply"
import { interfaceStore as InterfaceStore } from "@/opensource/stores/interface"
import EditorStore from "@/opensource/stores/chatNew/messageUI/editor"
export interface SendData {
	jsonValue: JSONContent | undefined
	normalValue: string
	files: ReportFileUploadsResponse[]
	onlyTextContent: boolean
	isLongMessage?: boolean
}

/**
 * 编辑器服务
 */
class EditorService {
	/**
	 * 获取AI自动补全
	 * @param text 文本
	 * @returns 自动补全结果
	 */
	fetchAiAutoCompletion = async (text: string) => {
		try {
			const res = await ChatApi.getConversationAiAutoCompletion({
				conversation_id: EditorStore.conversationId ?? "",
				topic_id: EditorStore.topicId ?? "",
				message: text,
			})
			const { conversation_id } = res.request_info
			// 如果会话id不一致,则返回空字符串
			if (conversation_id !== EditorStore.conversationId) return ""
			// 如果输入框没有内容,则返回空字符串
			if (!EditorStore.value) return ""
			return res.choices[0].message.content
		} catch (error) {
			console.error(error)
			return Promise.resolve("")
		}
	}

	/**
	 * 发送消息
	 * @param data 发送数据
	 */
	send = ({
		jsonValue,
		normalValue,
		onlyTextContent = true,
		files,
		isLongMessage = false,
	}: SendData) => {
		if (!ConversationStore.currentConversation?.id) {
			message.error("请先选择一个会话")
			return
		}
		// 长消息
		if (isLongMessage) {
			MessageService.sendLongMessage(
				ConversationStore.currentConversation?.id ?? "",
				{
					jsonValue,
					normalValue,
					onlyTextContent,
					files,
				},
				MessageReplyStore.replyMessageId,
			)
		} else {
			// 短消息
			MessageService.sendMessage(
				ConversationStore.currentConversation?.id ?? "",
				{
					jsonValue,
					normalValue,
					onlyTextContent,
					files,
				},
				MessageReplyStore.replyMessageId,
			)
		}

		// 关闭文生图启动页
		if (ConversationBotDataService.startPage && InterfaceStore.isShowStartPage) {
			InterfaceStore.closeStartPage()
		}
	}
}

export default new EditorService()
