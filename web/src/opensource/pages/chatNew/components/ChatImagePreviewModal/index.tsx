import MagicImagePreview from "@/opensource/components/base/MagicImagePreview"
import { Flex, Modal, Progress } from "antd"
import { useMemo, useRef, useState } from "react"
import { useBoolean, useMemoizedFn, useUpdateEffect } from "ahooks"
import { useTranslation } from "react-i18next"
import Draggable from "react-draggable"
import useCurrentImageSwitcher from "@/opensource/components/base/MagicImagePreview/hooks/useCurrentImageSwitcher"
import useImageSize from "@/opensource/components/base/MagicImagePreview/hooks/useImageSize"
import { resolveToString } from "@dtyq/es6-template-strings"
import { ResizableBox } from "react-resizable"
import type { ResizeCallbackData } from "react-resizable"
import { observer } from "mobx-react-lite"
import MessageFilePreviewStore from "@/opensource/stores/chatNew/messagePreview"
import MessageFilePreviewService from "@/opensource/services/chat/message/MessageFilePreview"
import useStyles from "./styles"
import Header from "./components/Header"
import useImageAction from "./hooks/useImageAction"
import "react-resizable/css/styles.css"
import ImageCompareSlider from "./components/ImageCompareSlider"

const ChatImagePreviewModal = observer(() => {
	const { previewInfo: info, open: openProps, message, ...rest } = MessageFilePreviewStore
	const { styles } = useStyles()
	const { t } = useTranslation("interface")
	const [open, { setTrue, setFalse }] = useBoolean(false)

	useUpdateEffect(() => {
		if (openProps) {
			setTrue()
		} else {
			setFalse()
		}
	}, [openProps])

	const closeModel = useMemoizedFn(() => {
		setFalse()
		MessageFilePreviewService.clearPreviewInfo()
	})

	const {
		currentImage,
		draggleRef,
		loading,
		progress,
		bounds,
		disabled,
		isCompare,
		isPressing,
		viewType,
		setViewType,
		onLongPressStart,
		onLongPressEnd,
		onDownload,
		navigateToMessage,
		onMouseOver,
		onMouseOut,
		onStart,
		onHighDefinition,
	} = useImageAction(info)

	const header = useMemo(() => {
		return (
			<Header
				info={info}
				loading={loading}
				message={message}
				onDownload={onDownload}
				onMouseOut={onMouseOut}
				onMouseOver={onMouseOver}
				onHighDefinition={onHighDefinition}
				navigateToMessage={navigateToMessage}
			/>
		)
	}, [
		info,
		loading,
		message,
		onDownload,
		onMouseOut,
		onMouseOver,
		onHighDefinition,
		navigateToMessage,
	])

	const { toNext, toPrev, nextDisabled, prevDisabled } = useCurrentImageSwitcher()

	const imageRef = useRef<HTMLImageElement>(null)
	const isLongImage = useImageSize(info?.url)

	const ImageNode = useMemo(() => {
		switch (info?.ext?.ext) {
			case "svg":
			case "svg+xml":
				return (
					currentImage && (
						<div
							draggable={false}
							dangerouslySetInnerHTML={{ __html: currentImage }}
							className={styles.svg}
						/>
					)
				)
			default:
				return (
					<img
						ref={imageRef}
						src={currentImage}
						alt=""
						draggable={false}
						style={
							isLongImage
								? {
										objectFit: "contain",
										width: "100%",
									}
								: {
										objectFit: "contain",
										width: "100%",
										height: "100%",
									}
						}
					/>
				)
		}
	}, [info?.ext?.ext, currentImage, styles.svg, isLongImage])

	const [bodySize, setBodySize] = useState({
		width: 800,
		height: 540,
	})

	const onResize = useMemoizedFn((_, { size }: ResizeCallbackData) => {
		setBodySize(size)
	})

	return (
		<Modal
			open={open}
			maskClosable={false}
			mask={false}
			onCancel={closeModel}
			onOk={closeModel}
			width="fit-content"
			wrapClassName={styles.wrapper}
			title={header}
			classNames={{
				content: styles.content,
				body: styles.body,
			}}
			centered
			footer={null}
			modalRender={(modal) => (
				<Draggable
					disabled={disabled}
					bounds={bounds}
					nodeRef={draggleRef}
					onStart={onStart}
				>
					<div ref={draggleRef}>{modal}</div>
				</Draggable>
			)}
			{...rest}
		>
			<ResizableBox
				className={styles.resizableContainer}
				width={bodySize.width}
				height={bodySize.height}
				minConstraints={[600, 400]}
				onResize={onResize}
			>
				<MagicImagePreview
					rootClassName={styles.imagePreview}
					onNext={info?.standalone ? undefined : toNext}
					onPrev={info?.standalone ? undefined : toPrev}
					nextDisabled={nextDisabled}
					prevDisabled={prevDisabled}
					hasCompare={isCompare}
					viewType={viewType}
					onChangeViewType={setViewType}
					onLongPressStart={onLongPressStart}
					onLongPressEnd={onLongPressEnd}
				>
					{isCompare ? (
						<ImageCompareSlider
							info={info}
							viewType={viewType}
							isPressing={isPressing}
						/>
					) : (
						ImageNode
					)}
				</MagicImagePreview>
				{loading && (
					<Flex align="center" gap={10} className={styles.mask}>
						<Progress percent={progress} showInfo={false} className={styles.progress} />
						<Flex
							vertical
							gap={2}
							align="center"
							justify="center"
							className={styles.progressText}
						>
							<span>
								{resolveToString(t("chat.imagePreview.hightImageConverting"), {
									num: progress,
								})}
							</span>
							<span>{t("chat.imagePreview.convertingCloseTip")}</span>
						</Flex>
					</Flex>
				)}
			</ResizableBox>
		</Modal>
	)
})

export default ChatImagePreviewModal
