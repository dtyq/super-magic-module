import { RoutePath } from "@/const/routes"
import { useCallback } from "react"
import type { NavigateOptions, To } from "react-router"
import { useNavigate as useReactNavigate } from "react-router"
import ConversationService from "../services/chat/conversation/ConversationService"
import ConversationStore from "@/opensource/stores/chatNew/conversation"

/**
 * 自定义 Navigate hook
 * @returns
 */
export const useNavigate = () => {
	const navigate = useReactNavigate()
	return useCallback(
		(path: To, options?: NavigateOptions) => {
			if (
				path === RoutePath.Chat &&
				ConversationStore.currentConversation?.isAiConversation
			) {
				// 初始化会话 agent 信息
				ConversationService.initConversationBotInfo(ConversationStore.currentConversation)
			}
			navigate(path, options)
		},
		[navigate],
	)
}

export default useNavigate
