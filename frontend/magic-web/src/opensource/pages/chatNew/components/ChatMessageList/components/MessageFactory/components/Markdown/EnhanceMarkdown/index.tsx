import Markdown from "react-markdown"
import { Suspense, memo, useMemo, useRef } from "react"
import { nanoid } from "nanoid"
import MessageRenderProvider from "@/opensource/components/business/MessageRenderProvider"
import { useFontSize } from "@/opensource/providers/AppearanceProvider/hooks"
import { useStyles as useMarkdownStyles } from "./styles/markdown.style"
import { useStreamStyles } from "./styles/stream.style"
import BlockRenderFactory from "./factories/BlockRenderFactory"
import type { MarkdownProps } from "./types"
import { useMarkdownConfig, useCursorManager, useClassName } from "./hooks"

/**
 * EnhanceMarkdown - 增强的Markdown渲染器
 * 支持流式渲染、代码高亮、数学公式等功能
 */
const EnhanceMarkdown = memo(function EnhanceMarkdown(props: MarkdownProps) {
	const {
		content,
		allowHtml = true,
		enableLatex = true,
		className,
		isSelf,
		isStreaming = false,
		hiddenDetail = false,
		...otherProps
	} = props

	const { fontSize } = useFontSize()
	const classNameRef = useRef<string>(`markdown-${nanoid(10)}`)

	// 使用样式hooks
	const { styles: mdStyles } = useMarkdownStyles(
		useMemo(
			() => ({ fontSize: hiddenDetail ? 12 : fontSize, isSelf, hiddenDetail }),
			[fontSize, isSelf, hiddenDetail],
		),
	)
	const { styles: streamStyles } = useStreamStyles()

	// 使用Markdown配置hook
	const markdownConfig = useMarkdownConfig({
		...props,
		allowHtml: allowHtml && !hiddenDetail,
		enableLatex,
	})

	// 使用光标管理hook
	useCursorManager({
		content,
		isStreaming,
		classNameRef,
		cursorClassName: streamStyles.cursor,
	})

	// 使用类名处理hook
	const combinedClassName = useClassName({
		mdStyles,
		className: className || "",
		classNameRef,
	})

	// 切割内容，分离oss-file文件
	const blocks = useMemo(() => {
		return BlockRenderFactory.getBlocks(content || "")
	}, [content])

	// 如果没有内容则不渲染
	if (!content) return null

	return (
		<MessageRenderProvider hiddenDetail={hiddenDetail}>
			{blocks.map((block, index) => {
				if (typeof block === "object" && block?.component) {
					return (
						<Suspense key={index} fallback={null}>
							<block.component key={index} {...block.props} />
						</Suspense>
					)
				}

				return (
					<Markdown
						key={index}
						className={combinedClassName}
						rehypePlugins={markdownConfig.rehypePlugins}
						remarkPlugins={markdownConfig.remarkPlugins}
						components={markdownConfig.components}
						{...otherProps}
					>
						{block as string}
					</Markdown>
				)
			})}
		</MessageRenderProvider>
	)
})

export default EnhanceMarkdown
