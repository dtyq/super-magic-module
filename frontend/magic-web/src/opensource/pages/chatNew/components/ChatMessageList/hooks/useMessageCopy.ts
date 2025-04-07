import type {
	ConversationMessage,
	ConversationMessageSend,
} from "@/types/chat/conversation_message"
import { ConversationMessageType } from "@/types/chat/conversation_message"
import type { SeqResponse } from "@/types/request"
import { useMemoizedFn } from "ahooks"
import { useMemo } from "react"
import useClipboard from "react-use-clipboard"
import { getRichMessagePasteText } from "../../ChatSubSider/utils"

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
/**
 * 根据消息类型复制消息内容
 * @param messageId
 * @returns
 */
const useMessageCopy = (
	message: SeqResponse<ConversationMessage> | ConversationMessageSend | undefined,
) => {
	const canCopy = useMemo(() => {
		switch (message?.message.type) {
			case ConversationMessageType.Text:
			case ConversationMessageType.RichText:
			case ConversationMessageType.Markdown:
			case ConversationMessageType.AggregateAISearchCard:
				return true
			default:
				return false
		}
	}, [message])

	const messageText = useMemo(() => {
		try {
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
		} catch (error) {
			return ""
		}
	}, [message])

	const [, copy] = useClipboard(messageText)

	const copyMessage = useMemoizedFn(() => {
		switch (message?.message.type) {
			case ConversationMessageType.RichText:
				const target = document.querySelector(
					`#message_copy_${message?.message_id} .tiptap.ProseMirror`,
				) as HTMLElement
				if (target) {
					copySelection(target)
				}
				break
			case ConversationMessageType.Text:
			case ConversationMessageType.Markdown:
			default:
				copy()
		}
	})

	return { canCopy, copy: copyMessage }
}

export default useMessageCopy
