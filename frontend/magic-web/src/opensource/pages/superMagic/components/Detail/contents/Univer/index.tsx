import { useEffect, useRef, useState } from "react"
import CommonHeader from "@/opensource/pages/superMagic/components/Detail/components/CommonHeader"
import { Skeleton } from "antd"
import { UniverComponent } from "@/opensource/components/UniverComponent"
import MagicFileIcon from "@/opensource/components/base/MagicFileIcon"
import CommonFooter from "../../components/CommonFooter"

export default function UniverViewer(props: any) {
	const {
		data,
		type,
		currentIndex,
		onPrevious,
		onNext,
		onFullscreen,
		onDownload,
		totalFiles,
		hasUserSelectDetail,
		isFromNode,
		file_extension = "xlsx",
		userSelectDetail,
		setUserSelectDetail,
		onClose,
		isFullscreen,
	} = props

	const { file_name, file_url } = data

	const [loading, setLoading] = useState(true)
	const [fileContent, setFileContent] = useState<any>(null)
	const containerRef = useRef<HTMLDivElement>(null)

	// 根据文件扩展名决定使用哪个图标
	const getFileIcon = () => {
		const extension = (file_extension || "").toLowerCase()
		return <MagicFileIcon type={extension} size={18} />
	}

	// 判断文件类型
	const getFileType = () => {
		const extension = (file_extension || "").toLowerCase()
		if (["xlsx", "xls", "csv"].includes(extension)) {
			return "sheet"
		} else if (["pptx", "ppt"].includes(extension)) {
			return "slide"
		}
		return "sheet" // 默认为sheet
	}

	// 从URL加载文件
	const fetchFileFromUrl = async (url: string) => {
		try {
			setLoading(true)

			// 通过fetch获取文件
			const response = await fetch(url)
			if (!response.ok) {
				throw new Error(`获取文件失败: ${response.status} ${response.statusText}`)
			}

			// 根据文件类型选择处理方法
			const fileType = getFileType()

			if (fileType === "sheet") {
				// 对于Excel文件，获取原始blob
				const blob = await response.blob()
				// 创建File对象
				const file = new File([blob], file_name, {
					type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
				})
				setFileContent(file)
			} else {
				// 对于其他类型，直接获取文本
				const text = await response.text()
				setFileContent(text)
			}
		} catch (error) {
			console.error("获取文件失败:", error)
			setFileContent("无法加载文件内容")
		} finally {
			setLoading(false)
		}
	}

	// 当组件加载或URL变化时获取文件
	useEffect(() => {
		if (file_url) {
			fetchFileFromUrl(file_url)
		} else {
			setLoading(false)
		}
	}, [file_url])

	return (
		<div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
			<CommonHeader
				title={file_name}
				icon={getFileIcon()}
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
			<div
				ref={containerRef}
				style={{ flex: 1, overflow: "hidden", padding: "16px", minHeight: "500px" }}
			>
				{loading ? (
					<Skeleton active paragraph={{ rows: 10 }} />
				) : (
					<UniverComponent
						data={fileContent}
						fileType={getFileType()}
						fileName={file_name}
						mode="readonly"
					/>
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
}
