import { RoutePath } from "@/const/routes"
import { MessageReceiveType } from "@/types/chat"
import { useMemoizedFn } from "ahooks"
import { useNavigate } from "@/opensource/hooks/useNavigate"
import conversationService from "@/opensource/services/chat/conversation/ConversationService"

/**
 * 与成员聊天
 * @param uid 成员id
 * @returns 发送消息
 */
export const useChatWithMember = () => {
	const navigate = useNavigate()
	const chatWith = useMemoizedFn(
		(
			uid?: string,
			receiveType: MessageReceiveType = MessageReceiveType.User,
			navigateToChat = true,
		) => {
			if (!uid) return Promise.reject(new Error("uid is required"))

			return conversationService.createConversation(receiveType, uid).then((conversation) => {
				if (conversation) {
					conversationService.switchConversation(conversation)
					if (navigateToChat) {
						navigate(RoutePath.Chat)
					}
				}
			})
		},
	)

	return chatWith
}
