import { RequestUrl } from "@/opensource/apis/constant"
import { ChatApi } from "@/opensource/apis"
import type { Bot } from "@/types/bot"
import type { SWRMutationResponse } from "swr/mutation"
import useSWRMutation from "swr/mutation"

/**
 * 获取 AI助理对应的机器人信息
 * @param user_id 用户ID
 * @returns
 */
const useAiAssistantBotInfo = (
	user_id?: string,
): SWRMutationResponse<
	Bot.Detail["botEntity"],
	Error,
	[string, RequestUrl.getAiAssistantBotInfo],
	{ user_id?: string }
> => {
	return useSWRMutation(user_id ? [user_id, RequestUrl.getAiAssistantBotInfo] : false, ([id]) =>
		ChatApi.getAiAssistantBotInfo({ user_id: id }),
	)
}

export default useAiAssistantBotInfo
