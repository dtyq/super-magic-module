import EnhanceMarkdown from "@/opensource/pages/chatNew/components/ChatMessageList/components/MessageFactory/components/Markdown/EnhanceMarkdown"
import type { HTMLAttributes } from "react"
import { memo } from "react"
import { createStyles } from "antd-style"
import ReasoningContent from "./ReasoningContent"
import streamLoadingIcon from "@/assets/resources/stream-loading-2.png"

interface MagicTextProps extends Omit<HTMLAttributes<HTMLDivElement>, "content"> {
	content?: string
	reasoningContent?: string
	isSelf?: boolean
	isStreaming?: boolean
	isReasoningStreaming?: boolean
}

const useStyles = createStyles(({ css }) => ({
	container: css`
		user-select: text;
	`,
}))

const Markdown = memo(function Markdown({
	content,
	reasoningContent,
	className,
	isSelf,
	isStreaming,
	isReasoningStreaming,
}: MagicTextProps) {
	// const { fontSize } = useChatFontSize()

	const { styles, cx } = useStyles()

	if (isReasoningStreaming || isStreaming) {
		if (!reasoningContent && !content) {
			return <img draggable={false} src={streamLoadingIcon} width={16} height={16} alt="loading" />
		}
	}

	return (
		<>
			<ReasoningContent content={reasoningContent} isStreaming={isReasoningStreaming} />
			<EnhanceMarkdown
				content={content as string}
				className={cx(styles.container, className)}
				isSelf={isSelf}
				isStreaming={isStreaming}
			/>
		</>
	)
})

export default Markdown
