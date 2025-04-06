import { BotApi } from "@/apis"
import { RoutePath } from "@/const/routes"
import useNavigate from "@/opensource/hooks/useNavigate"
import ConversationService from "@/opensource/services/chat/conversation/ConversationService"
import { MessageReceiveType } from "@/types/chat"
import { useMount } from "ahooks"

/**
 * 在url中携带agent_id参数时，自动创建会话
 */
const AgentIdKey = "agent_id"
const UserIdKey = "user_id"

/**
 * 在url中携带agent_id参数时，自动创建会话
 */
const useNavigateConversationByAgentIdInSearchQuery = () => {
	const navigate = useNavigate()
	useMount(() => {
		const agentId = window.sessionStorage.getItem(AgentIdKey)
		if (agentId) {
			BotApi.registerAndAddFriend(agentId)
				.then((res) => {
					return ConversationService.createConversation(
						MessageReceiveType.Ai,
						res.user_id,
					)
				})
				.then((res) => {
					if (res?.id) {
						ConversationService.switchConversation(res)
						window.sessionStorage.removeItem(AgentIdKey)
						// 跳转到 Chat 页面
						navigate(RoutePath.Chat)
					}
				})
				.catch((err) => {
					console.error("err", err)
				})
		}
		const userId = window.sessionStorage.getItem(UserIdKey)
		if (userId) {
			ConversationService.createConversation(MessageReceiveType.User, userId)
				.then((res) => {
					if (res?.id) {
						ConversationService.switchConversation(res)
						window.sessionStorage.removeItem(UserIdKey)
						// 跳转到 Chat 页面
						navigate(RoutePath.Chat)
					}
				})
				.catch((err) => {
					console.error("err", err)
				})
		}
	})
}

/**
 * 记录会话接收id到sessionStorage, 用于在url中携带agent_id或user_id时，自动创建会话
 */
export const recordConversationReceiveIdInSessionStorage = () => {
	const url = new URL(window.location.href)
	const { searchParams } = url
	const agentId = searchParams.get(AgentIdKey)
	if (agentId) {
		window.sessionStorage.setItem(AgentIdKey, agentId)
		searchParams.delete(AgentIdKey)
	}
	const userId = searchParams.get(UserIdKey)
	if (userId) {
		window.sessionStorage.setItem(UserIdKey, userId)
		searchParams.delete(UserIdKey)
	}

	// 清除url中的agent_id和user_id
	window.history.replaceState({}, "", url.toString())
}

export default useNavigateConversationByAgentIdInSearchQuery
