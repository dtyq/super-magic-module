import { nanoid } from "nanoid"

interface FileData {
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

export function genFileData(file: File): FileData {
	return {
		id: nanoid(),
		name: file.name,
		file,
		status: "init",
		progress: 0,
	}
}
