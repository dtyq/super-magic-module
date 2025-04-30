import MagicIcon from "@/opensource/components/base/MagicIcon"
import { memo } from "react"
import {
	IconArrowsDiagonal,
	IconArrowsDiagonalMinimize2,
	IconChevronLeft,
	IconChevronRight,
	IconDownload,
	IconX,
} from "@tabler/icons-react"
import { Flex } from "antd"
import { DetailType } from "../../types"
import { useResponsive } from "ahooks"
import { useStyles } from "./ActionButton.style"

interface ActionButtonsProps {
	type?: string
	currentAttachmentIndex?: number
	totalFiles?: number
	onPrevious?: () => void
	onNext?: () => void
	onFullscreen?: () => void
	onDownload?: () => void
	onClose?: () => void
	setUserSelectDetail?: (detail: any) => void
	hasUserSelectDetail?: boolean
	isFromNode?: boolean
	isFullscreen?: boolean
	isMobile?: boolean
}

export default memo(function ActionButtons(props: ActionButtonsProps) {
	const {
		type,
		currentAttachmentIndex = -1,
		totalFiles = 0,
		onPrevious,
		onNext,
		onFullscreen,
		onDownload,
		onClose,
		setUserSelectDetail,
		hasUserSelectDetail = true,
		isFromNode = false,
		isFullscreen = false,
	} = props

	const { styles } = useStyles()

	const isMobile = useResponsive().md === false

	// 如果是从Node点击打开的，则不显示按钮
	if (isFromNode) {
		return null
	}

	// 判断是否可以导航
	const canNavigatePrev = currentAttachmentIndex > 0
	const canNavigateNext = currentAttachmentIndex < totalFiles - 1 && totalFiles > 0

	// 判断当前文件类型是否可以下载
	const isDownloadable = () => {
		// 判断是否为可下载的文件类型：pdf、html、md、文本或代码文件
		return (
			type &&
			(type === DetailType.Pdf ||
				type === DetailType.Html ||
				type === DetailType.Md ||
				type === DetailType.Text ||
				type === DetailType.Code)
		)
	}

	// 处理左右切换
	const handlePrevious = () => {
		if (onPrevious) {
			onPrevious()
		}
	}

	const handleNext = () => {
		if (onNext) {
			onNext()
		}
	}

	// 处理全屏
	const handleFullscreen = () => {
		if (onFullscreen) {
			onFullscreen()
		}
	}

	// 处理下载
	const handleDownload = () => {
		if (onDownload) {
			onDownload()
		}
	}

	// 处理关闭
	const handleClose = () => {
		if (onClose) {
			onClose()
		} else if (setUserSelectDetail) {
			setUserSelectDetail(null)
		}
	}

	return (
		<Flex gap={4}>
			<MagicIcon
				size={28}
				component={IconChevronLeft}
				stroke={2}
				className={`${styles.iconCommon} ${!canNavigatePrev && styles.disabled}`}
				onClick={canNavigatePrev ? handlePrevious : undefined}
			/>
			<MagicIcon
				size={28}
				component={IconChevronRight}
				stroke={2}
				className={`${styles.iconCommon} ${!canNavigateNext && styles.disabled}`}
				onClick={canNavigateNext ? handleNext : undefined}
			/>

			{/* 移动端不显示全屏按钮 */}
			{!isMobile && !isFullscreen && (
				<MagicIcon
					size={28}
					component={IconArrowsDiagonal}
					stroke={2}
					className={styles.iconCommon}
					onClick={handleFullscreen}
				/>
			)}
			{!isMobile && isFullscreen && (
				<MagicIcon
					size={28}
					component={IconArrowsDiagonalMinimize2}
					stroke={2}
					className={styles.iconCommon}
					onClick={handleFullscreen}
				/>
			)}

			{isDownloadable() && (
				<MagicIcon
					size={28}
					component={IconDownload}
					stroke={2}
					className={`${styles.iconCommon}`}
					onClick={isDownloadable() ? handleDownload : undefined}
				/>
			)}

			{hasUserSelectDetail && !isMobile && (
				<MagicIcon
					size={28}
					component={IconX}
					stroke={2}
					className={`${styles.iconCommon}`}
					onClick={hasUserSelectDetail ? handleClose : undefined}
				/>
			)}
		</Flex>
	)
})
