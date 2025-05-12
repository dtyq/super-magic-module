import type { SeqMessageBase } from "./base"
import type { ConversationMessageStatus } from "./conversation_message"

/**
 * 即时消息类型
 */

export const enum IntermediateMessageType {
	/** 开始会话输入 */
	StartConversationInput = "start_conversation_input",
	/** 结束会话输入 */
	EndConversationInput = "end_conversation_input",
}

/**
 * 开始会话输入消息
 */
export interface StartConversationInputMessage extends SeqMessageBase {
	type: IntermediateMessageType.StartConversationInput
	unread_count: number
	send_time: number
	status: ConversationMessageStatus
}

/**
 * 结束会话输入消息
 */
export interface EndConversationInputMessage extends SeqMessageBase {
	type: IntermediateMessageType.EndConversationInput
	unread_count: number
	send_time: number
	status: ConversationMessageStatus
}
/**
 * 即时消息
 */

export type IntermediateMessage = StartConversationInputMessage | EndConversationInputMessage
