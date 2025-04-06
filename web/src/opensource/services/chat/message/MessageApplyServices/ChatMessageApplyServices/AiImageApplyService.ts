import MessageService from "@/opensource/services/chat/message/MessageService"
import type { AIImagesMessage } from "@/types/chat/conversation_message"
import { AIImagesDataType } from "@/types/chat/conversation_message"
import type { SeqResponse } from "@/types/request"
import type { ApplyMessageOptions } from "./types"

class AiImageApplyService {
	aiImageMessageIdMap: Record<string, string> = {}

	tempMessageMap: Record<string, SeqResponse<AIImagesMessage>> = {}

	/**
	 * 应用AI图像消息
	 * @param message AI图像消息对象
	 * @param options 应用选项
	 */
	apply(message: SeqResponse<AIImagesMessage>, options: ApplyMessageOptions) {
		const { isHistoryMessage } = options

		const {
			message: { app_message_id, ai_image_card },
			message_id,
		} = message

		const localMessageSeq = this.tempMessageMap[app_message_id] as
			| SeqResponse<AIImagesMessage>
			| undefined

		if (!localMessageSeq && ai_image_card?.type !== AIImagesDataType.StartGenerate) return

		const localMessage = localMessageSeq?.message as AIImagesMessage | undefined

		// 根据消息类型处理
		switch (ai_image_card?.type) {
			case AIImagesDataType.StartGenerate:
				if (isHistoryMessage) return
				// 如果是开始生成的消息，且本地没有记录，则添加消息
				if (!this.aiImageMessageIdMap[app_message_id] && !isHistoryMessage) {
					// 添加消息到数据库和内存
					MessageService.addReceivedMessage(message)
					// 更新消息 ID 映射
					this.aiImageMessageIdMap[app_message_id] = message_id
					this.tempMessageMap[app_message_id] = message
				}
				break

			case AIImagesDataType.ReferImage:
				// 引用图片消息直接添加
				MessageService.addReceivedMessage(message)
				break

			case AIImagesDataType.Error:
				if (isHistoryMessage) return
				// 错误消息处理
				if (!localMessage?.ai_image_card) {
					// 如果本地没有消息，直接添加
					MessageService.addReceivedMessage(message)
				} else if (localMessageSeq) {
					// 如果本地有消息，则更新消息
					this.updateOldAiImageMessage(message)
				}
				break

			case AIImagesDataType.GenerateComplete:
				// 生成完成消息处理
				if (!localMessage?.ai_image_card || !localMessageSeq) {
					// 如果本地没有消息，可能是历史消息应用，直接添加
					if (isHistoryMessage) MessageService.addReceivedMessage(message)
				} else {
					this.updateOldAiImageMessage(message)
				}
				break

			default:
				break
		}
	}

	/**
	 * 更新旧的AI图像消息
	 * @param message 新消息
	 */
	updateOldAiImageMessage(message: SeqResponse<AIImagesMessage>) {
		const {
			message: { app_message_id, topic_id },
			message_id,
			conversation_id,
		} = message

		const oldMessageId = this.aiImageMessageIdMap[app_message_id]

		this.aiImageMessageIdMap[app_message_id] = message_id
		this.tempMessageMap[app_message_id] = message

		MessageService.addReceivedMessage(message)
		MessageService.removeMessage(conversation_id, oldMessageId, topic_id ?? "")
	}
}

export default new AiImageApplyService()
