import type { UploadResponse } from "../../types"

export interface FileData {
	id: string
	name: string
	file: File
	status: "init" | "uploading" | "done" | "error"
	progress: number
	result?: UploadResponse
	error?: Error
	cancel?: () => void
}
