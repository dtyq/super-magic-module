import ChatFileService from "@/opensource/services/chat/file/ChatFileService"
import type { ChatFileUrlData } from "@/types/chat/conversation_message"
import type { SWRConfiguration } from "swr"
import useSWR from "swr"

/**
 * 批量获取文件信息
 * @param data 文件信息
 * @returns 文件信息
 */
const useChatFileUrls = (
	data?: { file_id: string; message_id: string }[],
	swrOptions?: SWRConfiguration,
) => {
	return useSWR<Record<string, ChatFileUrlData>>(
		data && data.length > 0 ? data : false,
		async () => ChatFileService.fetchFileUrl(data),
		swrOptions,
	)
}

export default useChatFileUrls
