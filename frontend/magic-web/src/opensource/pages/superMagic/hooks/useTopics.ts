import { ChatApi } from "@/apis"
import { generateSnowFlake } from "@/opensource/pages/flow/utils/helpers"
import { EventType } from "@/types/chat"
import type { ConversationMessageSend } from "@/types/chat/conversation_message"
import { ConversationMessageType } from "@/types/chat/conversation_message"
import { useCallback, useEffect, useState } from "react"
import type { FileItem, Workspace } from "../pages/Workspace/types"

export function useTopics(userInfo: any) {
	const [messages, setMessages] = useState<any[]>([])
	const [topicMessagesMap, setTopicMessagesMap] = useState<Record<string, any[]>>({})
	const [selectedThreadInfo, setSelectedThreadInfo] = useState<any | null>(null)
	const [fileList, setFileList] = useState<FileItem[]>([])
	const [attachments, setAttachments] = useState<FileItem[]>([])
	const handleSendMessage = useCallback(
		({ content, showLoading, selectedWorkspace, options }: any) => {
			if (!selectedThreadInfo?.id) {
				console.error("发送消息 - 未找到选中的话题")
				return
			}
			const message_id = generateSnowFlake()
			const Files = fileList.map((item) => {
				return {
					file_id: item.file_id,
					filename: item.file_name,
					fileize: item.file_size,
				}
			})
			const newMessage: any = {
				message_id,
				content,
				send_timestamp: new Date().toISOString(),
				type: "chat",
				attachments: Files,
				topic_id: selectedThreadInfo?.id,
			}
			const { chat_topic_id } = selectedThreadInfo
			const { conversation_id } = selectedWorkspace
			// 仅更新话题消息映射表，messages会通过useEffect自动更新,自己发送的消息没有seq_id,会被后续拉取的消息替代
			if (selectedThreadInfo?.id && newMessage.content) {
				setTopicMessagesMap((prev) => ({
					...prev,
					[chat_topic_id]: [...(prev[chat_topic_id] || []), newMessage],
				}))
			}
			const date = new Date().getTime()
			console.log(
				"发送消息",
				showLoading,
				chat_topic_id,
				"chat_topic_id",
				selectedThreadInfo,
				"selectedThreadInfo",
			)
			ChatApi.chat(
				EventType.Chat,
				{
					message: {
						type: ConversationMessageType.Text,
						text: {
							content,
							instructs: [{ value: showLoading ? "follow_up" : "normal" }],
							attachments: Files,
							...options,
						},
						send_timestamp: date,
						send_time: date,
						sender_id: userInfo?.user_id,
						app_message_id: message_id,
						message_id,
						topic_id: chat_topic_id,
					} as unknown as ConversationMessageSend["message"],
					conversation_id,
				},
				0,
			)
		},
		[fileList, selectedThreadInfo],
	)

	// 初始化话题消息映射表
	const initializeTopicMessages = useCallback((workspaces: Workspace[]) => {
		if (workspaces.length > 0) {
			// 保存当前的消息映射表，确保不会丢失已有的消息
			setTopicMessagesMap((prevMap) => {
				const messagesMap: Record<string, any[]> = { ...prevMap }

				// 遍历所有工作区的所有话题，确保每个话题都有一个条目
				workspaces.forEach((workspace) => {
					workspace.topics.forEach((topic) => {
						if (topic.id) {
							// 如果现有映射表中已有该话题的消息，则保留
							// 否则使用话题的历史记录
							if (!messagesMap[topic.id]) {
								messagesMap[topic.id] = []
							}
						}
					})
				})
				return messagesMap
			})
		}
	}, [])

	// 当selectedThreadInfo变化时，更新消息列表
	useEffect(() => {
		const { chat_topic_id } = selectedThreadInfo || {}
		if (chat_topic_id) {
			setMessages(topicMessagesMap[chat_topic_id] || [])
		} else {
			setMessages([])
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedThreadInfo, topicMessagesMap])

	return {
		messages,
		topicMessagesMap,
		fileList,
		setFileList,
		attachments,
		handleSendMessage,
		initializeTopicMessages,
		selectedThreadInfo,
		setTopicMessagesMap,
		setSelectedThreadInfo,
		setAttachments,
	}
}
