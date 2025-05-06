import { createStyles } from "antd-style"
import type React from "react"
// 导入所有工具图标
import bingSearchIcon from "@/opensource/pages/superMagic/assets/tool_icon/bing_search.svg"
import clickIcon from "@/opensource/pages/superMagic/assets/tool_icon/click.svg"
import DeafaulIcon from "@/opensource/pages/superMagic/assets/tool_icon/default.svg"
import deleteFileIcon from "@/opensource/pages/superMagic/assets/tool_icon/delete_file.svg"
import downloadFromUrlIcon from "@/opensource/pages/superMagic/assets/tool_icon/download_from_url.svg"
import fetchXiaoHongShuDataIcon from "@/opensource/pages/superMagic/assets/tool_icon/fetch_xiaohongshu_data.svg"
import fetchZhihuArticleDetailIcon from "@/opensource/pages/superMagic/assets/tool_icon/fetch_zhihu_article_detail.svg"
import fileSearchIcon from "@/opensource/pages/superMagic/assets/tool_icon/file_search.svg"
import finishTaskIcon from "@/opensource/pages/superMagic/assets/tool_icon/finish_task.svg"
import gotoIcon from "@/opensource/pages/superMagic/assets/tool_icon/goto.svg"
import inputTextIcon from "@/opensource/pages/superMagic/assets/tool_icon/input_text.svg"
import listDirIcon from "@/opensource/pages/superMagic/assets/tool_icon/list_dir.svg"
import pythonExecuteIcon from "@/opensource/pages/superMagic/assets/tool_icon/python_execute.svg"
import readAsMarkdownIcon from "@/opensource/pages/superMagic/assets/tool_icon/read_as_markdown.svg"
import readFileIcon from "@/opensource/pages/superMagic/assets/tool_icon/read_file.svg"
import readMoreAsMarkdownIcon from "@/opensource/pages/superMagic/assets/tool_icon/read_more_as_markdown.svg"
import reasoningIcon from "@/opensource/pages/superMagic/assets/tool_icon/reasoning.svg"
import replaceInFileIcon from "@/opensource/pages/superMagic/assets/tool_icon/replace_in_file.svg"
import shellExecIcon from "@/opensource/pages/superMagic/assets/tool_icon/shell_exec.svg"
import thinkingIcon from "@/opensource/pages/superMagic/assets/tool_icon/thinking.svg"
import getInteractiveElementsIcon from "@/opensource/pages/superMagic/assets/tool_icon/use_browser_get_interactive_elements.svg"
import scrollDownPageIcon from "@/opensource/pages/superMagic/assets/tool_icon/use_browser_scroll_page_down.svg"
import scrollUpPageIcon from "@/opensource/pages/superMagic/assets/tool_icon/use_browser_scroll_page_up.svg"
import wechatArticleSearchIcon from "@/opensource/pages/superMagic/assets/tool_icon/wechat_article_search.svg"
import writeToFileIcon from "@/opensource/pages/superMagic/assets/tool_icon/write_to_file.svg"

// 创建图标映射
const TOOL_ICONS: Record<string, string> = {
	shell_exec: shellExecIcon,
	list_dir: listDirIcon,
	use_browser_get_interactive_elements: getInteractiveElementsIcon,
	use_browser_input_text: inputTextIcon,
	use_browser_read_as_markdown: readAsMarkdownIcon,
	use_browser_read_more_as_markdown: readMoreAsMarkdownIcon,
	fetch_xiaohongshu_data: fetchXiaoHongShuDataIcon,
	fetch_zhihu_article_detail: fetchZhihuArticleDetailIcon,
	read_file: readFileIcon,
	filebase_read_file: readFileIcon,
	wechat_article_search: wechatArticleSearchIcon,
	bing_search: bingSearchIcon,
	use_browser_click: clickIcon,
	file_search: fileSearchIcon,
	use_browser_goto: gotoIcon,
	python_execute: pythonExecuteIcon,
	replace_in_file: replaceInFileIcon,
	delete_file: deleteFileIcon,
	finish_task: finishTaskIcon,
	use_browser_scroll_page_down: scrollDownPageIcon,
	use_browser_scroll_page_up: scrollUpPageIcon,
	write_to_file: writeToFileIcon,
	grep_search: fileSearchIcon,
	default: DeafaulIcon,
	thinking: thinkingIcon,
	filebase_search: fileSearchIcon,
	reasoning: reasoningIcon,
	download_from_url: downloadFromUrlIcon,
}

const useStyles = createStyles(({ css }) => {
	return {
		icon: css`
			display: inline-block;
			width: 20px;
			height: 20px;
		`,
	}
})

interface ToolIconProps {
	type: string
	className?: string
	style?: React.CSSProperties
}

const ToolIcon: React.FC<ToolIconProps> = ({ type, className, style }) => {
	const { styles } = useStyles()
	const iconSrc = TOOL_ICONS[type] || TOOL_ICONS.default // 使用默认图标作为回退

	return (
		<img
			src={iconSrc}
			alt={type}
			className={`${styles.icon} ${className || ""}`}
			style={style}
		/>
	)
}

export default ToolIcon
