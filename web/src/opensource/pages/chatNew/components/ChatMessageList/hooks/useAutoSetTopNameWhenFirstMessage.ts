import { useEffect } from "react"
import useCurrentTopic from "@/opensource/pages/chatNew/hooks/useCurrentTopic"
import TopicService from "@/opensource/services/chat/topic/index"

/**
 * 当存在话题且消息列表只有一条消息时，自动设置话题名称
 * @param chatId
 * @param topicId
 * @param messageIdsLength
 */
export default function useAutoSetTopNameWhenFirstMessage(messageIdsLength: number) {
	const currentTopic = useCurrentTopic()

	// 当存在话题且消息列表只有一条消息时，自动设置话题名称
	useEffect(() => {
		if (currentTopic && messageIdsLength === 1 && !currentTopic.name) {
			TopicService.getAndSetMagicTopicName?.(currentTopic.id)
		}
	}, [currentTopic, messageIdsLength])
}
