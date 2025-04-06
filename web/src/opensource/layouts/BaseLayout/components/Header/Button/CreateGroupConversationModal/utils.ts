import type { CreateGroupConversationParams as FormValues } from "@/types/chat/seen_message"
import { CreateGroupConversationParamKey as ParamKey } from "@/opensource/apis/modules/chat/types"
import { GroupConversationType } from "@/types/chat/conversation"

export const defaultFormValues = (): FormValues => ({
	[ParamKey.group_avatar]: "",
	[ParamKey.group_name]: "",
	[ParamKey.group_type]: GroupConversationType.Internal,
	[ParamKey.user_ids]: [],
	[ParamKey.department_ids]: [],
})
