import { MessageContextMenuKey } from "@/opensource/stores/chatNew/messageUI/const"
import MessageDropdownStore from "@/opensource/stores/chatNew/messageUI/Dropdown"
import MessageStore from "@/opensource/stores/chatNew/message"
import { IconArrowBackUp, IconCopy, IconMessageCircle2, IconTrash } from "@tabler/icons-react"
import { SendStatus, ConversationMessageType } from "@/types/chat/conversation_message"
import type { MenuItem } from "@/opensource/stores/chatNew/messageUI/const"
import { CONVERSATION_MESSAGE_CAN_REVOKE_TYPES } from "@/const/chat"
import { getRichMessagePasteText } from "@/opensource/pages/chatNew/components/ChatSubSider/utils"
import type { FullMessage } from "@/types/chat/message"
// import { recorder } from "@/opensource/pages/chatNew/components/MagicRecordSummary/helpers/record"
import MessageService from "@/opensource/services/chat/message/MessageService"
import MessageReplyService from "@/opensource/services/chat/message/MessageReplyService"
import type { ControlEventMessageType } from "@/types/chat"
import { ChatApi } from "@/apis"

const Items = {
	[MessageContextMenuKey.Copy]: {
		icon: {
			color: "currentColor",
			component: IconCopy,
			size: 20,
		},
		label: "chat.copy",
		key: MessageContextMenuKey.Copy,
	},
	[MessageContextMenuKey.Reply]: {
		icon: {
			color: "currentColor",
			component: IconMessageCircle2,
			size: 20,
		},
		label: "chat.reply",
		key: MessageContextMenuKey.Reply,
	},
	[MessageContextMenuKey.Revoke]: {
		icon: {
			color: "currentColor",
			component: IconArrowBackUp,
			size: 20,
		},
		label: "chat.recall",
		key: MessageContextMenuKey.Revoke,
	},
	[MessageContextMenuKey.Remove]: {
		icon: {
			color: "currentColor",
			component: IconTrash,
			size: 20,
		},
		danger: true,
		label: "chat.delete",
		key: MessageContextMenuKey.Remove,
	},
}

const Divider = {
	key: "divider-1",
	type: "divider",
}

function canCopy(messageType: ConversationMessageType | ControlEventMessageType) {
	return [
		ConversationMessageType.Text,
		ConversationMessageType.RichText,
		ConversationMessageType.Markdown,
		ConversationMessageType.AggregateAISearchCard,
	].includes(messageType as ConversationMessageType)
}

function canReply(messageType: ConversationMessageType | ControlEventMessageType) {
	return [
		ConversationMessageType.Text,
		ConversationMessageType.RichText,
		ConversationMessageType.Markdown,
		ConversationMessageType.AggregateAISearchCard,
	].includes(messageType as ConversationMessageType)
}

function selectElementText(el: Node) {
	// @ts-ignore
	if (document.selection) {
		// IE8 以下处理
		// @ts-ignore
		const oRange = document.body.createTextRange()
		oRange.moveToElementText(el)
		oRange.select()
	} else {
		const selection = window.getSelection() // get Selection object from currently user selected text
		selection?.removeAllRanges() // unselect any user selected text (if any)
		const range = document.createRange() // create new range object
		range.selectNodeContents(el) // set range to encompass desired element text
		selection?.addRange(range) // add range to Selection object to select it
	}
}

function copySelection(el: HTMLElement) {
	selectElementText(el)
	let copySuccess // var to check whether execCommand successfully executed
	try {
		// 复制选区
		window.navigator.clipboard.write([
			new ClipboardItem({
				"text/html": new Blob([el.innerHTML], { type: "text/html" }),
				"text/plain": new Blob([el.innerText], { type: "text/plain" }),
			}),
		])
		const selection = window.getSelection() // get Selection object from currently user selected text
		selection?.removeAllRanges() // unselect any user selected text (if any)
		copySuccess = true
	} catch (e) {
		copySuccess = false
	}
	return copySuccess
}

function getMessageText(message: FullMessage) {
	switch (message?.message.type) {
		case ConversationMessageType.Text:
			return message.message.text?.content ?? ""
		case ConversationMessageType.RichText:
			return getRichMessagePasteText(message.message.rich_text?.content) ?? ""
		case ConversationMessageType.Markdown:
			return message.message.markdown?.content ?? ""
		case ConversationMessageType.AggregateAISearchCard:
			return message.message.aggregate_ai_search_card?.llm_response ?? ""
		default:
			return ""
	}
}

function copyMessage(messageId: string) {
	console.log("copyMessage", messageId)
	const message = MessageDropdownStore.currentMessage

	switch (message?.message.type) {
		case ConversationMessageType.RichText:
			const target = document.querySelector(
				`#message_copy_${message?.message_id} .ProseMirror`,
			) as HTMLElement
			if (target) {
				copySelection(target)
			}
			break
		case ConversationMessageType.Text:
		case ConversationMessageType.Markdown:
		default:
			navigator.clipboard.writeText(getMessageText(message as FullMessage))
	}
}

function replyMessage(messageId: string) {
	// console.log("replyMessage", messageId)
	MessageReplyService.setReplyMessageId(messageId)
}

function revokeMessage(messageId: string) {
	console.log("revokeMessage", messageId)
	const message = MessageDropdownStore.currentMessage
	MessageService.flagMessageRevoked(
		message?.conversation_id ?? "",
		message?.message?.topic_id ?? "",
		messageId,
	)
	ChatApi.revokeMessage(messageId).then((res) => {
		console.log("撤回消息成功", res)
		// 更新数据库
	})
}

function removeMessage(messageId: string) {
	console.log("removeMessage", messageId)
	const message = MessageDropdownStore.currentMessage
	// if (message?.message?.type === ConversationMessageType.RecordingSummary) {
	// 	recorder.destroyRecord()
	// 	 chatBusiness.recordSummaryManager.updateIsRecording(false)
	// }
	MessageService.removeMessage(
		message?.conversation_id ?? "",
		messageId,
		message?.message?.topic_id ?? "",
	)
}

const clickFunctions: Partial<Record<MessageContextMenuKey, (messageId: string) => void>> = {
	[MessageContextMenuKey.Copy]: (messageId: string) => {
		copyMessage(messageId)
	},
	[MessageContextMenuKey.Reply]: (messageId: string) => {
		replyMessage(messageId)
	},
	[MessageContextMenuKey.Revoke]: (messageId: string) => {
		revokeMessage(messageId)
	},
	[MessageContextMenuKey.Remove]: (messageId: string) => {
		removeMessage(messageId)
	},
}

const MessageDropdownService = {
	resetMenu() {
		MessageDropdownStore.setMenu([])
	},

	setMenu(messageId: string): void {
		const message = MessageStore.getMessage(messageId)
		if (!message) return
		MessageDropdownStore.setCurrentMessageId(messageId)
		MessageDropdownStore.setCurrentMessage(message)
		const isSelf = message.is_self
		const inPending = MessageStore.getMessageSendStatus(messageId) === SendStatus.Pending

		const menu: MenuItem[] = []

		if (inPending) {
			menu.push(Items[MessageContextMenuKey.Copy])
		} else {
			if (canCopy(message.type)) {
				menu.push(Items[MessageContextMenuKey.Copy])
			}

			if (canReply(message.type)) {
				menu.push(Items[MessageContextMenuKey.Reply])
			}

			if (
				isSelf &&
				CONVERSATION_MESSAGE_CAN_REVOKE_TYPES.includes(
					message.type as ConversationMessageType,
				)
			) {
				if (menu.length > 0) menu.push(Divider)
				menu.push(Items[MessageContextMenuKey.Revoke])
			}

			menu.push(Items[MessageContextMenuKey.Remove])
		}

		MessageDropdownStore.setMenu(menu)
	},

	clickMenuItem(key: MessageContextMenuKey) {
		if (clickFunctions[key]) {
			clickFunctions[key]!(MessageDropdownStore.currentMessageId || "")
		}
	},
}

export default MessageDropdownService
