import type { FileItem } from "@/opensource/pages/superMagic/pages/Workspace/types"

export interface MessageSeqItem {
	magic_id: string
	seq_id: string
	message_id: string
	refer_message_id: string
	sender_message_id: string
	conversation_id: string
	organization_code: string
	message: {
		magic_message_id: string
		app_message_id: string
		topic_id: string
		type: string
		unread_count: 0
		sender_id: string
		send_time: number
		status: string
		general_agent_card: {
			topic_id: string
			message_id: string
			task_id: string
			type: string
			status: string
			content: string
			steps: unknown[]
			event: string
			role: string
			tool: {
				id: string
				name: string
				action: string
				status: string
				remark: string
				detail: unknown
				attachments: FileItem[]
			}
			send_timestamp: number
		}
	}
}

export interface MessageItem {
	type: "seq"
	seq: MessageSeqItem
}
