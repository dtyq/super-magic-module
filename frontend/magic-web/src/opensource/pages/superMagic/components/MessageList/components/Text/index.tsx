import MagicAva from "@/opensource/pages/superMagic/assets/svg/magicAva.svg"
import { userStore } from "@/opensource/models/user"
import { IconChecks } from "@tabler/icons-react"
import MarkDown from "react-markdown"
import { useStyles } from "./style"
import { observer } from "mobx-react-lite"

interface TextProps {
	data: any
	isUser: boolean
	hideHeader?: boolean
	isFinished?: boolean
}

function Text(props: TextProps) {
	const { styles } = useStyles()
	const { userInfo } = userStore.user
	const { data, isUser, hideHeader = false, isFinished = false } = props
	if (!data?.content && !data?.text?.content) return null
	const formatTimestamp = (timestamp: string) => {
		const date = new Date(timestamp)
		const month = date.getMonth() + 1
		const day = date.getDate()
		const hours = date.getHours().toString().padStart(2, "0")
		const minutes = date.getMinutes().toString().padStart(2, "0")
		return `${month}/${day} ${hours}:${minutes}`
	}

	// 检查是否是"finished"类型
	// let isFinished = data?.status === "finished"
	// 确定文本内容的样式类名
	let textContentClass = styles.assistantText
	if (isFinished) {
		textContentClass = styles.finishedText
	} else if (isUser) {
		textContentClass = styles.userText
	}

	return (
		<div
			className={`${styles.textContainer} ${
				isUser ? styles.userContainer : styles.assistantContainer
			}`}
		>
			{!hideHeader && (
				<div
					className={styles.textHeader}
					style={isUser ? { justifyContent: "flex-end" } : {}}
				>
					{isUser ? (
						<>
							<span className={styles.timestamp}>
								{formatTimestamp(data?.send_timestamp)}
							</span>
							<img src={userInfo?.avatar} alt="avatar" className={styles.avatar} />
						</>
					) : (
						<>
							<img src={MagicAva} alt="avatar" className={styles.avatar} />
							<span className={styles.timestamp}>
								{formatTimestamp(data?.send_timestamp)}
							</span>
						</>
					)}
				</div>
			)}
			<div className={`${styles.textContent} ${textContentClass}`}>
				{isFinished ? <IconChecks stroke={1.5} /> : null}
				<MarkDown
					className={styles.githubMarkdown}
					components={{
						a: ({ node, children, ...linkProps }) => (
							<a {...linkProps} target="_blank" rel="noopener noreferrer">
								{children}
							</a>
						),
					}}
				>
					{data?.content || data?.text?.content}
				</MarkDown>
			</div>
		</div>
	)
}

export default observer(Text)
