import MagicFileIcon from "@/opensource/components/base/MagicFileIcon"
import MagicIcon from "@/opensource/components/base/MagicIcon"
import FoldIcon from "@/opensource/pages/superMagic/assets/svg/file-folder.svg"
import topicEmpty from "@/opensource/pages/superMagic/assets/svg/topic-empty.svg"
import { downloadFileContent, getTemporaryDownloadUrl } from "@/opensource/pages/superMagic/utils/api"
import { getFileType } from "@/opensource/pages/superMagic/utils/handleFIle"
import { IconChevronDown, IconChevronRight, IconDownload } from "@tabler/icons-react"
import { useResponsive } from "ahooks"
import { Button, Input, Tooltip, Typography } from "antd"
import { useEffect, useMemo, useState } from "react"
import useStyles from "./style"

const { Text } = Typography

// 定义文件和文件夹类型
interface FileItem {
	file_id: string
	file_name: string
	filename?: string
	file_extension: string
	is_directory?: boolean
	display_filename?: string
	[key: string]: any
}

interface FolderItem {
	name: string
	type: string
	is_directory: true
	children: (FileItem | FolderItem)[]
	path: string
	[key: string]: any
}

type AttachmentItem = FileItem | FolderItem

// 定义图片文件扩展名的数组
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp", "ico", "tiff", "tif"]

export default function AttachmentList({
	attachments,
	setUserSelectDetail,
}: {
	attachments: any[]
	setUserSelectDetail?: (detail: any) => void
}) {
	const { styles, cx } = useStyles()
	const [isFileListCollapsed, setIsFileListCollapsed] = useState(false)
	const [fileSearchText, setFileSearchText] = useState("")
	const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({})
	const responsive = useResponsive()
	const isMobile = responsive.md === false

	// 切换文件夹的展开/折叠状态
	const toggleFolder = (folderId: string, e: React.MouseEvent) => {
		e.stopPropagation()
		setCollapsedFolders((prev) => ({
			...prev,
			[folderId]: !prev[folderId],
		}))
	}

	// 过滤文件列表
	const filteredFiles = useMemo(() => {
		if (!attachments) return []

		// // 递归过滤图片类型的文件
		// const filterNonImageFiles = (items: AttachmentItem[]): AttachmentItem[] => {
		// 	return items.filter((item: AttachmentItem) => {
		// 		// 如果是文件夹，递归处理其子项
		// 		if (item.is_directory && "children" in item) {
		// 			const filteredChildren = filterNonImageFiles(item.children)
		// 			// 如果过滤后的子项为空，则不展示此文件夹
		// 			if (filteredChildren.length === 0) {
		// 				return false
		// 			}
		// 			// 创建新的文件夹对象，避免修改原对象
		// 			return {
		// 				...item,
		// 				children: filteredChildren,
		// 			}
		// 		}

		// 		// 获取文件扩展名并转为小写
		// 		const extension = (item.file_extension || "").toLowerCase()

		// 		// 如果扩展名在图片扩展名列表中，则过滤掉
		// 		return !IMAGE_EXTENSIONS.includes(extension)
		// 	})
		// }

		// // 先过滤掉图片类型的文件
		// const nonImageFiles = filterNonImageFiles(attachments)

		if (!fileSearchText.trim()) return attachments

		const filterItems = (items: AttachmentItem[]): AttachmentItem[] => {
			return items.filter((item) => {
				// 检查是否为文件夹
				if (item.is_directory && "children" in item) {
					// 对文件夹名称进行搜索
					const folderMatch = (item.name || "")
						.toLowerCase()
						.includes(fileSearchText.toLowerCase())

					// 递归搜索子文件/文件夹
					const filteredChildren = filterItems(item.children)

					// 如果文件夹名称匹配或子项有匹配，则保留此文件夹
					return folderMatch || filteredChildren.length > 0
				} else {
					// 对文件名进行搜索
					return (item.filename || item.file_name || "")
						.toLowerCase()
						.includes(fileSearchText.toLowerCase())
				}
			})
		}

		return filterItems(attachments)
	}, [attachments, fileSearchText])

	const handleDownloadFile = (file_id: string, e: React.MouseEvent<HTMLSpanElement>) => {
		e.stopPropagation()
		getTemporaryDownloadUrl({ file_ids: [file_id] }).then((res: any) => {
			window.open(res[0]?.url, "_blank")
		})
	}

	const handleOpenFile = (item: AttachmentItem) => {
		// 如果是文件夹，不做任何操作
		if (item.is_directory) return

		getTemporaryDownloadUrl({ file_ids: [item.file_id] }).then((res: any) => {
			const fileName = item.display_filename || item.file_name || item.filename
			const type = getFileType(item.file_extension)
			if (type) {
				setUserSelectDetail?.({
					type, // 根据文件扩展名确定类型
					data: {
						content: "",
						file_name: fileName,
						file_url: res[0]?.url,
						file_extension: item.file_extension,
						file_id: item.file_id,
					},
					currentFileId: item.file_id,
					attachments,
				})
				downloadFileContent(res[0]?.url).then((data: any) => {
					setTimeout(() => {
						setUserSelectDetail?.({
							type, // 根据文件扩展名确定类型
							data: {
								content: data,
								file_name: fileName,
								file_url: res[0]?.url,
								file_extension: item.file_extension,
								file_id: item.file_id,
							},
							currentFileId: item.file_id,
							attachments,
						})
					}, 500)
				})
			} else {
				setUserSelectDetail?.({
					type: "empty",
					data: {
						text: "暂不支持预览该文件,请下载该文件",
					},
				})
			}
		})
	}

	// 根据是否移动端渲染文本
	const renderText = (text: string, tooltipTitle: string) => {
		if (isMobile) {
			return <Text className={styles.ellipsis}>{text}</Text>
		}

		return (
			<Tooltip title={tooltipTitle} placement="right">
				<Text className={styles.ellipsis}>{text}</Text>
			</Tooltip>
		)
	}

	// 递归渲染文件和文件夹
	const renderItems = (items: AttachmentItem[], level = 0) => {
		// 检查是否至少存在一个文件夹
		const hasFolders = items.some((item) => item.is_directory && "children" in item)

		return items.map((item: AttachmentItem) => {
			// 判断是否为文件夹
			if (item.is_directory && "children" in item) {
				const isFolderCollapsed = collapsedFolders[`/${item.path}`]

				// 计算嵌套层级的缩进宽度
				const indentWidth = level * 24

				return (
					<div key={item.name} className={styles.folderContainer}>
						<div
							className={styles.fileItem}
							onClick={(e) => toggleFolder(`/${item.path}`, e)}
						>
							{/* 使用固定结构的布局 */}
							<div
								style={{
									display: "flex",
									alignItems: "center",
									flex: 1,
									overflow: "hidden",
									paddingLeft: indentWidth + "px",
								}}
							>
								<div className={styles.iconWrapper}>
									<Button
										type="text"
										size="small"
										icon={
											<MagicIcon
												size={18}
												component={
													isFolderCollapsed
														? IconChevronDown
														: IconChevronRight
												}
												stroke={2}
											/>
										}
										onClick={(e) => toggleFolder(`/${item.path}`, e)}
										className={styles.iconButton}
									/>
								</div>
								<div className={styles.iconWrapper} style={{ marginLeft: "2px" }}>
									<img src={FoldIcon} alt="folder" width={18} height={18} />
								</div>
								<div className={styles.fileNameContainer}>
									{renderText(item.name, item.name)}
								</div>
							</div>
						</div>
						{isFolderCollapsed && (
							<div className={styles.folderContent}>
								{renderItems(item.children, level + 1)}
							</div>
						)}
					</div>
				)
			} else {
				// 渲染文件
				// 计算嵌套层级的缩进宽度
				const indentWidth = level * 24

				return (
					<div
						key={item.file_id}
						className={styles.fileItem}
						onClick={(e) => {
							e.stopPropagation()
							handleOpenFile(item)
						}}
					>
						{/* 使用固定结构的布局 */}
						<div
							style={{
								display: "flex",
								alignItems: "center",
								flex: 1,
								overflow: "hidden",
								paddingLeft: indentWidth + "px",
							}}
						>
							{/* 只有在有文件夹存在时或者不是顶层时才显示空白占位按钮 */}
							{(hasFolders || level > 0) && (
								<div className={styles.iconWrapper}>
									<Button
										type="text"
										size="small"
										className={styles.iconButton}
										style={{
											visibility: "hidden",
											width: "18px",
											height: "18px",
										}}
									/>
								</div>
							)}
							<div
								className={styles.iconWrapper}
								style={{ marginLeft: hasFolders || level > 0 ? "2px" : "0" }}
							>
								<MagicFileIcon
									type={item.file_extension}
									size={18}
									className={styles.threadTitleImage}
								/>
							</div>
							<div className={styles.fileNameContainer}>
								{renderText(item.file_name, item.file_name)}
							</div>
						</div>
						<MagicIcon
							className={styles.attachmentAction}
							onClick={(e: any) => handleDownloadFile(item.file_id, e)}
							component={IconDownload}
							stroke={2}
							size={18}
						/>
					</div>
				)
			}
		})
	}

	return (
		<div className={cx(styles.section, isFileListCollapsed && styles.collapsed)}>
			<div className={styles.header}>
				<div className={styles.titleContainer}>
					<div className={styles.iconWrapper}>
						<Button
							type="text"
							size="small"
							icon={
								<MagicIcon
									size={18}
									component={
										isFileListCollapsed ? IconChevronRight : IconChevronDown
									}
									stroke={2}
								/>
							}
							onClick={() => {
								setIsFileListCollapsed(!isFileListCollapsed)
							}}
							className={styles.iconButton}
						/>
					</div>
					<span>话题文件</span>
				</div>
			</div>
			{!isFileListCollapsed && (
				<div className={styles.content}>
					<div className={styles.searchContainer}>
						<Input
							placeholder="搜索文件"
							value={fileSearchText}
							onChange={(e) => setFileSearchText(e.target.value)}
							className={styles.searchInput}
						/>
					</div>
					{!!filteredFiles.length && (
						<div className={styles.listContainer}>{renderItems(filteredFiles, 0)}</div>
					)}
					{!!attachments?.length && !filteredFiles.length && fileSearchText && (
						<div className={styles.emptyText}>
							<img src={topicEmpty} alt="" className={styles.emptyTextIcon} />
							未找到相关文件
						</div>
					)}
					{attachments?.length === 0 && (
						<div className={styles.emptyText}>
							<img src={topicEmpty} alt="" className={styles.emptyTextIcon} />
							暂无相关文件
						</div>
					)}
				</div>
			)}
		</div>
	)
}
