import {
	IconTextFile,
	IconMarkdownFile,
	IconPDFFile,
	IconExcelFile,
	IconDocxFile,
	IconXMindFile,
	IconOtherFile,
} from "@/enhance/tabler/icons-react"

// 文件类型映射
export const fileTypesMap = {
	TXT: "txt",
	MD: "md",
	PDF: "pdf",
	XLSX: "xlsx",
	XLS: "xls",
	DOCX: "docx",
	CSV: "csv",
	XML: "xml",
}

// 支持向量知识库嵌入的文件类型
export const supportedFileTypes = Object.values(fileTypesMap)

// 获取文件类型图标
export const getFileTypeIcon = (extension: string, size = 24) => {
	const map = {
		[fileTypesMap.TXT]: <IconTextFile size={size} />,
		[fileTypesMap.MD]: <IconMarkdownFile size={size} />,
		[fileTypesMap.PDF]: <IconPDFFile size={size} />,
		[fileTypesMap.XLSX]: <IconExcelFile size={size} />,
		[fileTypesMap.XLS]: <IconExcelFile size={size} />,
		[fileTypesMap.DOCX]: <IconDocxFile size={size} />,
		[fileTypesMap.CSV]: <IconExcelFile size={size} />,
		[fileTypesMap.XML]: <IconXMindFile size={size} />,
	}
	return map[extension] || <IconOtherFile size={size} />
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

/** 知识库支持嵌入的文件类型 */
export const SUPPORTED_EMBED_FILE_TYPES =
	"text/plain,text/markdown,.md,.markdown,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/csv,text/xml"

/** 知识库类型 */
export enum knowledgeType {
	/** 用户自建知识库 */
	UserKnowledgeDatabase = 1,
	/** 天书知识库 */
	TeamshareKnowledgeDatabase = 2,
}

/** 文档操作类型枚举 */
export enum DocumentOperationType {
	ENABLE = "enable",
	DISABLE = "disable",
	DELETE = "delete",
}

/** 分段模式 */
export enum SegmentationMode {
	/** 通用模式 */
	General = 1,
	/** 父子分段 */
	ParentChild = 2,
}

/** 父块模式 */
export enum ParentBlockMode {
	/** 段落 */
	Paragraph = 1,
	/** 全文 */
	FullText = 2,
}

/** 文本预处理规则 */
export enum TextPreprocessingRules {
	/** 替换掉连续的空格、换行符和制表符 */
	ReplaceSpaces = 1,
	/** 删除所有 URL 和电子邮件地址 */
	RemoveUrls = 2,
}

/** 检索方法 */
export enum RetrievalMethod {
	/** 语义检索 */
	SemanticSearch = "semantic_search",
	/** 全文检索 */
	FullTextSearch = "full_text_search",
	/** 混合检索 */
	HybridSearch = "hybrid_search",
	/** 图检索 */
	GraphSearch = "graph_search",
}
