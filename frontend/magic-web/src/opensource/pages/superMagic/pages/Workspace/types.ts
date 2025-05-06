// 工作区相关类型
import type { Key, ReactNode } from "react"

export interface Thread {
	chat_topic_id: any
	id: string
	topic_name: string
	sort: string
	history?: any[]
	attachments?: any[]
	topics?: any[]
	task_status?: "waiting" | "running" | "finished" | "error"
	is_archived?: number
}

export interface Workspace {
	id: string
	name: string
	sort: number
	topics: Thread[]
	expanded?: boolean
	conversation_id: string
	status?: "waiting" | "running" | "finished" | "error" // 其实没有这个字段，但是为了兼容旧数据，所以加了这个字段
}

// 消息相关类型
export interface Message {
	id: string
	content: string
	timestamp: string
	sender?: string
	type: string
	attachments?: FileItem[] | []
}

// 消息详情相关类型
export interface Step {
	id: string
	title: string
	content: string
	timestamp: string
}

export interface MessageDetail {
	id: string
	content: string
	timestamp: string
	sender: string
	steps: {
		title: string
		content: string
	}[]
}

export interface FileItem {
	file_id: Key | null | undefined
	file_size: number | undefined
	file_name: string
	file_key: string | undefined
	key?: string
	name?: string
	size?: number
	path?: string
	filename?: string
	url?: string
	type?: string
	icon?: ReactNode
	color?: string
}

// 任务列表相关类型
export interface TaskProcess {
	id: string
	title: string
	status: "waiting" | "running" | "finished" | "error"
	[key: string]: any
}

export interface TaskData {
	process: TaskProcess[]
	topic_id: string
}
