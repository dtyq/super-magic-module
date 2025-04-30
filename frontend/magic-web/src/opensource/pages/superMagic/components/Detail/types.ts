/** 详情类型 */
export enum DetailType {
	Terminal = "terminal",
	Browser = "browser",
	Search = "search",
	Html = "html",
	Text = "text",
	Md = "md",
	Pdf = "pdf",
	Code = "code",
	Empty = "empty",
	Excel = "excel",
	PowerPoint = "powerpoint",
	Image = "image",
}

/** 详情 */
export interface DetailData {
	[DetailType.Terminal]: DetailTerminalData
	[DetailType.Browser]: DetailBrowserData
	[DetailType.Search]: DetailSearchData
	[DetailType.Html]: DetailHTMLData
	[DetailType.Text]: DetailTextData
	[DetailType.Md]: DetailMDData
	[DetailType.Empty]: any
	[DetailType.Excel]: DetailUniverData
	[DetailType.PowerPoint]: DetailUniverData
}

/** 终端 Terminal */
export interface DetailTerminalData {
	action: "execute" | string
	finished: boolean
	shellId: string
	command: string
	outputType?: "append" | string
	output: string[]
	code: string
}

/** 浏览器 Browser */
export interface DetailBrowserData {
	url: string
	screenshot: string
	preview: string
}

/** MD文件 TextEditor */
export interface DetailMdData {
	action: "write" | "update" | string
	path: string
	content: string
	oldContent?: string
}

/** 搜索 Search */
export interface DetailSearchData {
	data: {
		favicon?: string
		title: string
		link: string
		snippet: string
	}[]
}

/** 参数 Arguments */
export interface DetailArgumentsData {
	command: string
	file: string
	path: string
	content?: string
}

/** 超文本标记语言 HTML */
export interface DetailHTMLData {
	content: string
	title: string
}

/** 工具 Tool */
export interface DetailToolData {
	name: string
	action: string
}

/** 文本 Text */
export interface DetailTextData {
	content: string
}

/** 富文本 MD */
export interface DetailMDData {
	content: string
}

export interface DetailTodoData {
	content: string
}

/** Univer数据 */
export interface DetailUniverData {
	content: any
	file_name: string
	file_extension?: string
}
