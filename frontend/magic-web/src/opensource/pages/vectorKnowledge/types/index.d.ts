export interface FileData {
	id: string
	name: string
	file: File
	status: "init" | "uploading" | "done" | "error"
	progress: number
	result?: {
		key: string
		name: string
		size: number
	}
	error?: Error
	cancel?: () => void
}
