import {
	IconTextFile,
	IconMarkdownFile,
	IconPDFFile,
	IconHtmlFile,
	IconExcelFile,
	IconDocFile,
	IconDocxFile,
	IconXMindFile,
	IconOtherFile,
} from "@/enhance/tabler/icons-react"

// 文件类型映射
export const fileTypesMap = {
	TXT: "txt",
	MD: "md",
	PDF: "pdf",
	HTML: "html",
	XLSX: "xlsx",
	XLS: "xls",
	DOCX: "docx",
	CSV: "csv",
	XML: "xml",
	HTM: "htm",
}

// 支持向量知识库嵌入的文件类型
export const supportedFileTypes = Object.values(fileTypesMap)

// 文件类型图标映射
export const fileTypeIconsMap = {
	[fileTypesMap.TXT]: <IconTextFile size={24} />,
	[fileTypesMap.MD]: <IconMarkdownFile size={24} />,
	[fileTypesMap.PDF]: <IconPDFFile size={24} />,
	[fileTypesMap.HTML]: <IconHtmlFile size={24} />,
	[fileTypesMap.XLSX]: <IconExcelFile size={24} />,
	[fileTypesMap.XLS]: <IconExcelFile size={24} />,
	[fileTypesMap.DOCX]: <IconDocxFile size={24} />,
	[fileTypesMap.CSV]: <IconExcelFile size={24} />,
	[fileTypesMap.XML]: <IconXMindFile size={24} />,
	[fileTypesMap.HTM]: <IconOtherFile size={24} />,
}

/** 文档同步状态映射 */
export enum documentSyncStatusMap {
	/** 未同步 */
	Pending = 0,
	/** 已同步 */
	Success = 1,
	/** 同步失败 */
	Failed = 2,
	/** 同步中 */
	Processing = 3,
	/** 删除成功 */
	Deleted = 4,
	/** 删除失败 */
	DeleteFailed = 5,
	/** 重建中 */
	Rebuilding = 6,
}

/** 知识库默认图标的OSS key */
export const DEFAULT_ICON_OSS_KEY =
	"MAGIC/open/2c17c6393771ee3048ae34d6b380c5ec/NnsZ43-d-ut3WrZqGTpOR.png"

/** 知识库支持嵌入的文件类型 */
export const SUPPORTED_EMBED_FILE_TYPES =
	"text/plain,text/markdown,.md,.markdown,application/pdf,text/html,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/csv,text/xml,text/html"
