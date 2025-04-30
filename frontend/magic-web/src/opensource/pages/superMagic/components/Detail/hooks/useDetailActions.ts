import { useState, useEffect, useMemo } from "react"
import { downloadFileContent, getTemporaryDownloadUrl } from "@/opensource/pages/superMagic/utils/api"
import { getFileType } from "@/opensource/pages/superMagic/utils/handleFIle"

// 定义图片文件扩展名的数组
const IMAGE_EXTENSIONS = [
	"jpg",
	"jpeg",
	"png",
	"gif",
	"bmp",
	"svg",
	"webp",
	"ico",
	"tiff",
	"tif",
	"sh",
	// "xlsx",
]

export function useDetailActions({
	disPlayDetail,
	setUserSelectDetail,
	attachments,
}: {
	disPlayDetail: any
	setUserSelectDetail?: (detail: any) => void
	attachments?: any[]
}) {
	const [isFullscreen, setIsFullscreen] = useState(false)
	// 判断是否来自Node点击
	const isFromNode = disPlayDetail?.isFromNode || false
	const [currentIndex, setCurrentIndex] = useState<number>(-1)

	// 判断是否使用消息的附件列表（而不是话题的整体附件列表）
	const shouldUseMessageAttachments = useMemo(() => {
		return !!disPlayDetail?.attachments && Array.isArray(disPlayDetail.attachments)
	}, [disPlayDetail?.attachments])

	// 确定要使用的附件列表
	const effectiveAttachments = useMemo(() => {
		return shouldUseMessageAttachments ? disPlayDetail.attachments : attachments
	}, [attachments, disPlayDetail?.attachments, shouldUseMessageAttachments])

	// 收集所有文件（非目录）并扁平化，同时过滤掉图片文件
	const collectFiles = (items: any[]): any[] => {
		let files: any[] = []
		if (!items || !Array.isArray(items)) return files

		items.forEach((item) => {
			if (item.is_directory && Array.isArray(item.children)) {
				files = [...files, ...collectFiles(item.children)]
			} else if (!item.is_directory) {
				// 获取文件扩展名并转为小写
				const extension = (item.file_extension || "").toLowerCase()

				// 如果不是图片文件，则添加到结果中
				if (!IMAGE_EXTENSIONS.includes(extension)) {
					files.push(item)
				}
			}
		})
		return files
	}

	// 所有文件的扁平化列表
	const allFiles = useMemo(() => collectFiles(effectiveAttachments || []), [effectiveAttachments])

	// 当附件列表和currentFileId存在时，找到当前文件在附件列表中的索引
	useEffect(() => {
		if (allFiles.length > 0 && disPlayDetail?.currentFileId) {
			const fileIndex = allFiles.findIndex(
				(file) => file.file_id === disPlayDetail?.currentFileId,
			)
			if (fileIndex !== -1) {
				setCurrentIndex(fileIndex)
			}
		}
	}, [allFiles, disPlayDetail, setCurrentIndex])

	// 处理打开文件
	const handleOpenFile = (item: any) => {
		if (!item || !item.file_id) return

		getTemporaryDownloadUrl({ file_ids: [item.file_id] }).then((res: any) => {
			downloadFileContent(res[0]?.url).then((data: any) => {
				const fileName = item.display_filename || item.file_name || item.filename
				const type = getFileType(item.file_extension)
				if (type) {
					setUserSelectDetail?.({
						type,
						data: {
							content: data,
							file_name: fileName,
							file_url: res[0]?.url,
							file_extension: item.file_extension,
						},
						currentFileId: item.file_id,
						// 保持与当前上下文相同的附件列表
						attachments:
							disPlayDetail?.attachments && Array.isArray(disPlayDetail.attachments)
								? disPlayDetail.attachments
								: attachments,
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
		})
	}

	// 处理切换到上一个文件
	const handlePrevious = () => {
		if (allFiles.length > 0 && currentIndex > 0) {
			handleOpenFile(allFiles[currentIndex - 1])
		}
	}

	// 处理切换到下一个文件
	const handleNext = () => {
		if (allFiles.length > 0 && currentIndex < allFiles.length - 1) {
			handleOpenFile(allFiles[currentIndex + 1])
		}
	}

	// 处理全屏显示
	const handleFullscreen = () => {
		setIsFullscreen(!isFullscreen)
	}

	// 处理下载文件
	const handleDownload = () => {
		if (disPlayDetail?.data?.file_name && disPlayDetail?.currentFileId) {
			getTemporaryDownloadUrl({ file_ids: [disPlayDetail?.currentFileId] }).then(
				(res: any) => {
					window.open(res[0]?.url, "_blank")
				},
			)
		}
	}

	return {
		isFullscreen,
		isFromNode,
		handlePrevious,
		handleNext,
		handleFullscreen,
		handleDownload,
		handleOpenFile,
		allFiles,
		currentIndex,
		effectiveAttachments,
	}
}
