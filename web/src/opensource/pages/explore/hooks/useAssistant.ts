import { useMemoizedFn } from "ahooks"
import { MessageReceiveType } from "@/types/chat"
import { RoutePath } from "@/const/routes"
import { useNavigate } from "@/opensource/hooks/useNavigate"
import ConversationService from "@/opensource/services/chat/conversation/ConversationService"

export default function useAssistant() {
	const navigate = useNavigate()

	const navigateConversation = useMemoizedFn(async (user_id: string) => {
		const conversation = await ConversationService.createConversation(
			MessageReceiveType.Ai,
			`${user_id}`,
		)

		if (conversation) {
			ConversationService.switchConversation(conversation)
			navigate(RoutePath.Chat)
		}
	})

	return {
		navigateConversation,
	}
}
