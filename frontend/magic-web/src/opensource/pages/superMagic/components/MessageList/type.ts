export interface TaskProps {
	task: {
		status: "done" | "doing" | "pending" | string
		title: string
		id: string
	}
}

export interface NodeProps {
	node: {
		id?: string | number
		type?: string
		sender?: string
		content?: string
		brief?: string
		description?: string
		text?: string
		detail?: any
		tasks?: Array<TaskProps["task"]>
		attachments?: any
		agentStatus?: string
		timestamp?: number | string
		topic_id?: string | number
	}
	onSelectDetail?: (detail: any) => void
	isSelected?: boolean
}

export interface ManusViewerProps {
	data: Array<NodeProps["node"]>
	setSelectedDetail: (detail: any) => void
	selectedNodeId?: string | null
}

export interface AttachmentProps {
	attachment: {
		key: string
		name: string
		size: number
		url?: string
		filename?: string
		contentLength?: number
		src?: string
	}
}
