import { nanoid } from "nanoid"
import type { FileData } from "./types"

export function genFileData(file: File): FileData {
	return {
		id: nanoid(),
		name: file.name,
		file,
		status: "init",
		progress: 0,
	}
}
