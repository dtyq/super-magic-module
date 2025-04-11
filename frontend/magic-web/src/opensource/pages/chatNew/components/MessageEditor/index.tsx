import { useMemoizedFn } from "ahooks"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { ChatApi } from "@/apis"
import type { Content } from "@tiptap/core"
import MessageService from "@/opensource/services/chat/message/MessageService"
import ConversationStore from "@/opensource/stores/chatNew/conversation"
import { message } from "antd"
import MessageReplyStore from "@/opensource/stores/chatNew/messageUI/Reply"
import { observer } from "mobx-react-lite"
import type { SendData } from "./MagicInput"
import ConversationInput from "./MagicInput"
import { interfaceStore } from "@/opensource/stores/interface"
import ConversationBotDataService from "@/opensource/services/chat/conversation/ConversationBotDataService"

interface MessageEditorProps {
	visible?: boolean
	disabled?: boolean
	className?: string
	inputClassName?: string
	// scrollControl?: ScrollControl | null
}

const MessageEditor = observer(function MessageEditor({
	visible = true,
	disabled,
	className,
	inputClassName,
}: MessageEditorProps) {
	const [value, setValue] = useState<Content | undefined>(undefined)
	const { t } = useTranslation()

	const aiAutoCompletion = useMemo(() => {
		return {
			fetchSuggestion: (text: string) => {
				try {
					return ChatApi.getConversationAiAutoCompletion({
						conversation_id: ConversationStore.currentConversation?.id ?? "",
						topic_id: ConversationStore.currentConversation?.current_topic_id ?? "",
						message: text,
					}).then((res) => {
						const { conversation_id } = res.request_info
						// 如果会话id不一致,则返回空字符串
						if (conversation_id !== ConversationStore.currentConversation?.id) return ""
						// 如果输入框没有内容,则返回空字符串
						if (!value) return ""
						return res.choices[0].message.content
					})
				} catch (error) {
					console.error(error)
					return Promise.resolve("")
				}
			},
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		ConversationStore.currentConversation?.current_topic_id,
		ConversationStore.currentConversation?.id,
		value,
	])

	const onSend = useMemoizedFn(
		({ jsonValue, normalValue, onlyTextContent = true, files }: SendData) => {
			console.log("发送消息", jsonValue, normalValue, onlyTextContent, files)
			if (!ConversationStore.currentConversation?.id) {
				message.error("请先选择一个会话")
				return
			}
			MessageService.sendMessage(
				ConversationStore.currentConversation?.id ?? "",
				{
					jsonValue,
					normalValue,
					onlyTextContent,
					files,
				},
				MessageReplyStore.replyMessageId,
			)

			if (ConversationBotDataService.startPage && interfaceStore.isShowStartPage) {
				interfaceStore.closeStartPage()
			}
		},
	)

	return (
		<ConversationInput
			visible={visible}
			disabled={disabled}
			defaultValue={value}
			onChange={setValue}
			onSend={onSend}
			placeholder={t("chat.pleaseEnterMessageContent", { ns: "message" })}
			sendWhenEnter
			aiAutoCompletion={aiAutoCompletion}
			className={className}
			inputMainClassName={inputClassName}
		/>
	)
})

export default MessageEditor
