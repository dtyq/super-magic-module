import MagicFileIcon from "@/opensource/components/base/MagicFileIcon"
import MagicSpin from "@/opensource/components/base/MagicSpin"
import { getTemporaryDownloadUrl } from "@/opensource/pages/superMagic/utils/api"
import { memo, useEffect, useState } from "react"
import MarkDown from "react-markdown"
import remarkGfm from "remark-gfm"
import CommonHeader from "../../components/CommonHeader"
import { useStyles } from "./styles"
import CommonFooter from "../../components/CommonFooter"
import { DetailType } from "../../types"

interface AttachmentFile {
	file_id: string
	file_name: string
	is_directory?: boolean
	setUserSelectDetail?: (detail: any) => void
	children?: AttachmentFile[]
	[key: string]: any
}

export default memo(function TextEditor(props: any) {
	const {
		data,
		attachments,
		setUserSelectDetail,
		type,
		currentIndex,
		onPrevious,
		onNext,
		onFullscreen,
		onDownload,
		totalFiles,
		hasUserSelectDetail,
		isFromNode,
		onClose,
		userSelectDetail,
		isFullscreen,
	} = props
	const { styles } = useStyles()
	const [processedContent, setProcessedContent] = useState<string>(data?.content || "")
	const [isLoading, setIsLoading] = useState<boolean>(!data?.content)

	useEffect(() => {
		const processMarkdownImages = async () => {
			if (!data?.content) {
				setIsLoading(true)
				return
			}

			setIsLoading(true)
			// 匹配 markdown 中的图片
			const imageRegex = /!\[.*?\]\(([^)]+)\)/g
			const matches = [...data.content.matchAll(imageRegex)]

			if (matches.length === 0) {
				setProcessedContent(data.content)
				setIsLoading(false)
				return
			}

			// 收集所有需要处理的图片路径
			const imagesToProcess: string[] = []
			const fileIdMap = new Map<string, string>()

			for (const match of matches) {
				const imgUrl = match[1]
				// 检查是否是远程URL
				if (imgUrl.startsWith("http://") || imgUrl.startsWith("https://")) {
					continue
				}

				// 从路径中提取文件名
				const pathParts = imgUrl.split("/")
				const fileName = pathParts[pathParts.length - 1]

				// 在attachments中查找匹配的文件
				const findFile = (items: AttachmentFile[]): AttachmentFile | null => {
					if (!Array.isArray(items) || items.length === 0) {
						return null
					}

					for (const item of items) {
						if (item.is_directory && item.children) {
							const found = findFile(item.children)
							if (found) return found
						} else if (item.file_name === fileName) {
							return item
						}
					}
					return null
				}

				const matchedFile = findFile(attachments)
				if (matchedFile) {
					imagesToProcess.push(matchedFile.file_id)
					fileIdMap.set(matchedFile.file_id, imgUrl)
				}
			}

			if (imagesToProcess.length > 0) {
				try {
					// 批量获取临时下载链接
					const downloadUrls =
						(await getTemporaryDownloadUrl({
							file_ids: imagesToProcess,
						})) || []

					// 替换内容中的图片URL
					let newContent = data.content
					for (const urlInfo of downloadUrls) {
						const originalUrl = fileIdMap.get(urlInfo.file_id)
						if (originalUrl) {
							// 使用正则表达式替换特定的图片URL
							const imgRegex = new RegExp(
								`!\\[(.*?)\\]\\(${originalUrl.replace(
									/[.*+?^${}()|[\]\\]/g,
									"\\$&",
								)}\\)`,
								"g",
							)
							newContent = newContent.replace(imgRegex, `![$1](${urlInfo.url})`)
						}
					}

					setProcessedContent(newContent)
					setIsLoading(false)
				} catch (error) {
					console.error("Error fetching download URLs:", error)
					setProcessedContent(data.content)
					setIsLoading(false)
				}
			} else {
				setProcessedContent(data.content)
				setIsLoading(false)
			}
		}

		processMarkdownImages()
	}, [data?.content, attachments])

	return (
		<div className={styles.textEditorContainer}>
			<CommonHeader
				icon={<MagicFileIcon size={20} type="md" />}
				title={data?.file_name || data?.title}
				setUserSelectDetail={setUserSelectDetail}
				type={type}
				currentAttachmentIndex={currentIndex}
				totalFiles={totalFiles}
				onPrevious={onPrevious}
				onNext={onNext}
				onFullscreen={onFullscreen}
				onDownload={onDownload}
				hasUserSelectDetail={hasUserSelectDetail}
				isFromNode={isFromNode}
				onClose={onClose}
				isFullscreen={isFullscreen}
			/>
			<div className={styles.editorBody}>
				{isLoading ? (
					<div className={styles.loadingContainer}>
						<MagicSpin spinning />
					</div>
				) : (
					<MarkDown
						remarkPlugins={[remarkGfm]}
						components={{
							a: ({ node, children, ...linkProps }) => {
								// 检查链接是否为锚点（以#开头）
								if (linkProps.href && linkProps.href.startsWith("#")) {
									// 如果是锚点，渲染为普通文本
									return <span>{children}</span>
								}
								// 非锚点链接正常渲染
								return (
									<a {...linkProps} target="_blank" rel="noopener noreferrer">
										{children}
									</a>
								)
							},
							li: ({ node, className, ...liProps }: any) => {
								// 检查是否为任务列表项
								if ("checked" in liProps) {
									const { checked } = liProps
									// 从props中移除checked属性，避免传递给li元素
									delete liProps.checked

									return (
										<li
											className={`task-list-item ${className || ""}`}
											{...liProps}
										>
											<input
												type="checkbox"
												checked={checked || false}
												readOnly
											/>
											{liProps.children}
										</li>
									)
								}
								return <li className={className} {...liProps} />
							},
						}}
						className={styles.githubMarkdown}
					>
						{processedContent}
					</MarkDown>
				)}
			</div>
			{isFromNode && (
				<CommonFooter
					setUserSelectDetail={setUserSelectDetail}
					userSelectDetail={userSelectDetail}
					onClose={onClose}
				/>
			)}
		</div>
	)
})
