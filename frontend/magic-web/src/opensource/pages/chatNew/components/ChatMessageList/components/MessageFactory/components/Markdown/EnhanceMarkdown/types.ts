import type { Options as MarkdownOptions } from "react-markdown"

export interface MarkdownProps extends MarkdownOptions {
	content?: string
	allowHtml?: boolean
	enableLatex?: boolean
	isSelf?: boolean
	hiddenDetail?: boolean
	isStreaming?: boolean
}
