import { useMessageRenderContext } from "@/opensource/components/business/MessageRenderProvider/hooks"
import { useBoolean, useMemoizedFn } from "ahooks"
import type React from "react"
import { useState, memo, useMemo, useRef, useEffect } from "react"
import { isString } from "lodash-es"
import { useTranslation } from "react-i18next"
import { Skeleton } from "antd"
import useChatFileUrls from "@/opensource/hooks/chat/useChatFileUrls"
import conversationStore from "@/opensource/stores/chatNew/conversation"
import { observer } from "mobx-react-lite"
import type { PreviewFileInfo } from "@/opensource/services/chat/message/MessageFilePreview"
import NetworkErrorContent from "@/opensource/pages/chatNew/components/ChatMessageList/components/MessageFactory/components/NetworkErrorContent"
import useImageSize from "../../hooks/useImageSize"
import { useStyles } from "./styles"

type HTMLImageElementProps = JSX.IntrinsicElements["img"]

interface ImageWrapperProps extends HTMLImageElementProps {
	/** 容器 className */
	containerClassName?: string
	/** 文件 id */
	fileId?: string
	/** 旧文件 id */
	oldFileId?: string
	/** 图片在该消息下的索引 */
	index?: number
	/** 消息 id */
	messageId?: string
	/** 独立渲染, 不参与上下页切换 */
	standalone?: boolean
	/** 是否使用高清图   */
	useHDImage?: boolean
	/** 图片加载失败时的回调 */
	reload?: () => void
	/** 图片扩展名 */
	imgExtension?: string
	/** 图片大小 */
	fileSize?: number
	/** 图片加载中的占位符 */
	loader?: (cls?: string) => React.ReactNode
}

const ImageWrapper = observer((props: ImageWrapperProps) => {
	const {
		src: srcInProps,
		alt,
		className,
		containerClassName,
		fileId,
		oldFileId,
		index = 0,
		messageId,
		standalone = false,
		useHDImage = false,
		reload,
		onError: onErrorInProps,
		onLoad: onLoadInProps,
		imgExtension,
		fileSize,
		loader,
		...rest
	} = props
	const { t } = useTranslation("interface")
	const { styles, cx } = useStyles()
	const { hiddenDetail } = useMessageRenderContext()
	const imageRef = useRef<HTMLImageElement>(null)
	const [fileInfo, setFileInfo] = useState<PreviewFileInfo>()
	const isLongImage = useImageSize(fileInfo?.url)

	const [error, { setTrue, setFalse }] = useBoolean(false)
	const { currentConversation: conversation } = conversationStore

	const { data: urls, isLoading } = useChatFileUrls(
		useMemo(() => {
			const files = []
			if (messageId && fileId && isString(fileId)) {
				files.push({
					message_id: messageId,
					file_id: fileId,
				})
				if (oldFileId && isString(oldFileId)) {
					files.push({
						message_id: messageId,
						file_id: oldFileId,
					})
				}
			}
			return files
		}, [messageId, fileId, oldFileId]),
	)

	useEffect(() => {
		const url = fileId && messageId ? urls?.[fileId]?.url : srcInProps
		const oldUrl = oldFileId && messageId ? urls?.[oldFileId]?.url : undefined

		if (imgExtension?.startsWith("svg")) {
			setFileInfo({
				url,
				ext: { ext: "svg+xml", mime: "image/svg+xml" },
				fileId,
				messageId,
				conversationId: conversation?.id,
				index,
				standalone,
				useHDImage,
				fileSize,
			})
		} else {
			setFileInfo({
				url,
				ext: { ext: "jpg", mime: "image/jpeg" }, // 默认认为是 jpg, 并不需要具体知道是什么类型的, 暂时不影响判断
				fileId,
				oldFileId,
				oldUrl,
				messageId,
				conversationId: conversation?.id,
				index,
				standalone,
				useHDImage,
				fileSize,
			})
		}
	}, [
		conversation?.id,
		fileId,
		fileSize,
		imgExtension,
		index,
		messageId,
		oldFileId,
		srcInProps,
		standalone,
		urls,
		useHDImage,
	])

	const handleReloadImage = useMemoizedFn(() => {
		reload?.()
		setFalse()
	})

	const onError = useMemoizedFn((e) => {
		onErrorInProps?.(e)
		setTrue()
	})

	const onLoad = useMemoizedFn((e) => {
		onLoadInProps?.(e)
	})

	const fileInfoBase64 = useMemo(() => {
		return btoa(JSON.stringify(fileInfo ?? {}))
	}, [fileInfo])

	const ImageNode = useMemo(() => {
		if (fileInfo?.ext?.ext?.startsWith("svg") && fileInfo?.url) {
			return (
				<button
					type="button"
					className={cx(styles.button)}
					disabled={!fileInfo?.url}
					draggable={false}
				>
					<div
						className={styles.image}
						data-file-info={fileInfoBase64}
						// eslint-disable-next-line react/no-danger
						dangerouslySetInnerHTML={{ __html: fileInfo?.url }}
					/>
				</button>
			)
		}

		if (isLoading || !fileInfo?.url) {
			return loader ? (
				loader?.(className)
			) : (
				<Skeleton.Image className={styles.skeletonImage} active={isLoading} />
			)
		}

		return (
			<div style={{ height: "100%" }}>
				{isLongImage && (
					<span className={styles.longImageTip}>{t("chat.message.image.longImage")}</span>
				)}
				<img
					ref={imageRef}
					src={fileInfo?.url}
					alt={alt ?? fileInfo?.fileName}
					data-file-info={fileInfoBase64}
					className={cx(
						styles.image,
						{ [styles.longImage]: isLongImage },
						className,
						"magic-image",
					)}
					onError={onError}
					onLoad={onLoad}
					draggable={false}
					{...rest}
				/>
			</div>
		)
	}, [
		alt,
		className,
		cx,
		fileInfo?.ext?.ext,
		fileInfo?.fileName,
		fileInfo?.url,
		fileInfoBase64,
		isLoading,
		isLongImage,
		loader,
		onError,
		onLoad,
		rest,
		styles.button,
		styles.image,
		styles.longImage,
		styles.longImageTip,
		styles.skeletonImage,
		t,
	])

	if (hiddenDetail) {
		return t("chat.message.placeholder.image")
	}

	if (error) {
		return (
			<NetworkErrorContent
				className={cx(styles.networkError, containerClassName)}
				onReload={handleReloadImage}
			/>
		)
	}

	return <div className={cx(containerClassName, styles.wrapper)}>{ImageNode}</div>
})

const MemoizedImage = memo(ImageWrapper) as typeof ImageWrapper

export default MemoizedImage
