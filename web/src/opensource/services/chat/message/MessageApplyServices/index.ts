import type { SeqResponse } from "@/types/request"
import type { CMessage } from "@/types/chat"
import { bigNumCompare } from "@/utils/string"
import ConversationStore from "@/opensource/stores/chatNew/conversation"
import { ConversationStatus } from "@/types/chat/conversation"
import { ChatApi } from "@/apis"
import ChatMessageApplyService from "./ChatMessageApplyServices"
import ControlMessageApplyService from "./ControlMessageApplyService"
import messageSeqIdService from "../MessageSeqIdService"
import ConversationService from "../../conversation/ConversationService"

type ApplyMessageOptions = {
	isHistoryMessage?: boolean
	sortCheck?: boolean
	updateLastSeqId?: boolean
}

/**
 * 消息应用服务
 * 负责处理和应用各种类型的消息（控制类、聊天类和流式消息）
 */
class MessageApplyService {
	fetchingPromiseMap: Record<string, Promise<void>> = {}

	/**
	 * 应用一条消息
	 * @param message 待应用的消息
	 * @param options 应用选项
	 */
	async applyMessage(
		message: SeqResponse<CMessage>,
		options: ApplyMessageOptions = {
			isHistoryMessage: false,
			sortCheck: true,
			updateLastSeqId: true,
		},
	) {
		const { sortCheck = true } = options

		// 检查消息是否已经被应用过
		if (
			sortCheck &&
			bigNumCompare(
				message.seq_id,
				messageSeqIdService.getOrganizationRenderSeqId(message.organization_code) ?? "",
			) <= 0
		) {
			console.warn("此消息已应用", message.seq_id)
			return
		}

		const conversation = ConversationStore.getConversation(message.conversation_id)
		console.log("applyMessage =====> conversation ====> ", conversation)
		if (!conversation) {
			// 如果会话不存在，则拉取会话列表
			if (!this.fetchingPromiseMap[message.conversation_id]) {
				this.fetchingPromiseMap[message.conversation_id] = ChatApi
					.getConversationList([message.conversation_id])
					.then(({ items }) => {
						delete this.fetchingPromiseMap[message.conversation_id]
						if (items.length === 0) return
						if (items[0].status === ConversationStatus.Normal) {
							ConversationService.addNewConversation(items[0])
						}
					})
			}

			await this.fetchingPromiseMap[message.conversation_id]
		}

		switch (true) {
			case ControlMessageApplyService.isControlMessage(message):
				ControlMessageApplyService.apply(message, options)
				break
			case ChatMessageApplyService.isChatMessage(message):
				ChatMessageApplyService.apply(message, options)
				break
			default:
				break
		}
	}
}

export default new MessageApplyService()
