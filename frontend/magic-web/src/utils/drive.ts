import { DriveItemFileType } from "@/types/drive"

/**
 * 获取文件访问路径
 * @param id 文件 ID
 * @param fType 文件类型
 * @returns 路径
 */
export const getDriveFileRedirectUrl = (id: string, fType: DriveItemFileType) => {
	if (fType === DriveItemFileType.CLOUD_DOC) {
		return `/docs/${id}`
	}
	if (fType === DriveItemFileType.CLOUD_DOCX) {
		return `/docx/${id}`
	}
	if (fType === DriveItemFileType.WHITEBOARD) {
		return `/whiteboard/${id}`
	}
	if (fType === DriveItemFileType.MULTI_TABLE) {
		return `/base/${id}`
	}
	if (
		[
			DriveItemFileType.WORD,
			DriveItemFileType.EXCEL,
			DriveItemFileType.PPT,
			DriveItemFileType.PDF,
		].includes(fType)
	) {
		return `/office/${id}`
	}
	if (
		[
			DriveItemFileType.XMIND,
			DriveItemFileType.VIDEO,
			DriveItemFileType.IMAGE,
			DriveItemFileType.AUDIO,
			DriveItemFileType.UNKNOWN,
		].includes(fType)
	) {
		return `/file/${id}`
	}

	if (fType === DriveItemFileType.KNOWLEDGE_BASE) {
		return `/knowledge/directory/${id}`
	}

	return undefined
}
