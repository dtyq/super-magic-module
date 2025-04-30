import MagicFileIcon from "@/opensource/components/base/MagicFileIcon"
import { downloadFileContent, getTemporaryDownloadUrl } from "@/opensource/pages/superMagic/utils/api"
import { getFileType } from "@/opensource/pages/superMagic/utils/handleFIle"
import { Button, Space } from "antd"
import { useState } from "react"
import { useStyles } from "./style"
import type { AttachmentProps } from "./type"
import MagicIcon from "@/opensource/components/base/MagicIcon"
import { IconChevronDown, IconChevronRight, IconDownload, IconEye } from "@tabler/icons-react"

export const Attachment = ({
	attachments,
	onSelectDetail,
}: {
	attachments?: Array<AttachmentProps>
	onSelectDetail: any
}) => {
	const { styles } = useStyles()
	const [expanded, setExpanded] = useState(false)
	const toggleExpanded = () => {
		setExpanded(!expanded)
	}

	const handleDownload = (file_id: string) => {
		getTemporaryDownloadUrl({ file_ids: [file_id] }).then((res: any) => {
			window.open(res[0]?.url, "_blank")
		})
	}
	const displayedAttachments =
		expanded || !attachments || attachments.length <= 4 ? attachments : attachments.slice(0, 4)

	const show = Array.isArray(attachments) && attachments.length > 0

	const handleOpenFile = (item: any) => {
		const fileName = item.display_filename || item.file_name || item.filename
		const type = getFileType(item.file_extension)
		console.log("type", type, item.file_extension, "item.file_extensionitem.file_extension")
		if (type) {
			// 先给一个空字符串占位，唤起预览
			// onSelectDetail?.({
			// 	type, // 根据文件扩展名确定类型
			// 	data: {
			// 		content: "",
			// 		file_name: fileName,
			// 		file_extension: item.file_extension,
			// 	},
			// 	currentFileId: item.file_id,
			// 	attachments,
			// })
			getTemporaryDownloadUrl({ file_ids: [item.file_id] }).then((res: any) => {
				downloadFileContent(res[0]?.url).then((data: any) => {
					onSelectDetail?.({
						type, // 根据文件扩展名确定类型
						data: {
							content: data,
							file_name: fileName,
							file_url: res[0]?.url,
							file_extension: item.file_extension,
						},
						currentFileId: item.file_id,
						// attachments,
					})
				})
			})
		} else {
			onSelectDetail?.({
				type: "empty",
				data: {
					text: "暂不支持预览该文件,请下载该文件",
				},
			})
		}
	}

	if (!show) return null
	return (
		<div className={styles.attachmentContainer}>
			<div className={styles.attachmentTitleRow} onClick={toggleExpanded}>
				<div className={styles.attachmentTitle}>附件 ({attachments.length})</div>
				{attachments.length > 4 && expanded ? (
					<IconChevronDown className={styles.icon} />
				) : (
					<IconChevronRight className={styles.icon} />
				)}
			</div>
			{!!displayedAttachments?.length && (
				<div className={styles.attachmentList}>
					{displayedAttachments?.map((item: AttachmentProps) => (
						<div
							key={`attachment-${item.filename}-${item.contentLength}`}
							className={styles.attachmentItemContainer}
							onClick={(e) => {
								e.stopPropagation()
								handleOpenFile(item)
							}}
						>
							<div className={styles.attachmentItem}>
								<MagicFileIcon
									type={item.file_extension}
									size={24}
									className={styles.threadTitleImage}
								/>

								<span className={styles.attachmentName}>
									{item.display_filename || item.file_name || item.filename}
								</span>
								{/* {item.contentLength && (
                                        <span className={styles.attachmentSize}>{formatFileSize(item.contentLength)}</span>
                                    )} */}
								<MagicIcon
									className={styles.attachmentEye}
									onClick={toggleExpanded}
									component={IconEye}
									stroke={2}
									size={18}
								/>
								<MagicIcon
									className={styles.attachmentAction}
									onClick={(e: any) => {
										e.stopPropagation()
										handleDownload(item.file_id)
									}}
									component={IconDownload}
									stroke={2}
									size={18}
								/>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	)
}
