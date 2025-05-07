/* eslint-disable class-methods-use-this */
import MessagePreviewStore from "@/opensource/stores/chatNew/messagePreview"
import ConversationStore from "@/opensource/stores/chatNew/conversation"
import type { FileTypeResult } from "file-type"

/** 预览文件信息 */
export type PreviewFileInfo = {
	messageId: string | undefined
	conversationId: string | undefined
	fileId?: string
	// 原图文件id
	oldFileId?: string
	// 原图文件url
	oldUrl?: string
	fileName?: string
	fileSize?: number
	index?: number
	url?: string
	ext?:
		| Partial<FileTypeResult>
		| { ext?: "svg"; mime?: "image/svg+xml" }
		| { ext?: string; mime?: string }
	/** 是否独立显示 */
	standalone?: boolean
	/** 是否使用转高清功能 */
	useHDImage?: boolean
}

class MessageFilePreview {
	setPreviewInfo(info: PreviewFileInfo) {
		if (!info.messageId || !info.url) return
		info.conversationId = ConversationStore.currentConversation?.id
		MessagePreviewStore.setPreviewInfo(info)
	}

	clearPreviewInfo() {
		MessagePreviewStore.clearPreviewInfo()
	}

	/**
	 * 复制文件
	 */
	copy(dom: HTMLImageElement | HTMLCanvasElement) {
		const ext = MessagePreviewStore.previewInfo?.ext?.ext
		switch (ext) {
			case "svg":
			case "svg+xml":
				if (MessagePreviewStore.previewInfo?.url) {
					this.copySvg(MessagePreviewStore.previewInfo?.url)
				}
				break
			default:
				this.copyImage(dom)
				break
		}
	}

	/**
	 * 复制图片
	 * @param imgDom 图片元素
	 */
	copyImage(dom: HTMLImageElement | HTMLCanvasElement) {
		try {
			// 处理HTMLImageElement类型
			if (dom instanceof HTMLImageElement) {
				// 创建一个临时canvas
				const canvas = document.createElement("canvas")
				canvas.width = dom.naturalWidth || dom.width
				canvas.height = dom.naturalHeight || dom.height

				// 创建新图像避免跨域问题
				const img = new Image()
				img.crossOrigin = "anonymous"
				img.onload = () => {
					const ctx = canvas.getContext("2d")
					if (ctx) {
						ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
						this.copyCanvasToClipboard(canvas)
					}
				}
				img.src = dom.src
				return
			}

			// 处理HTMLCanvasElement类型
			if (dom instanceof HTMLCanvasElement) {
				this.copyCanvasToClipboard(dom)
				return
			}
		} catch (error) {
			console.error("Failed to copy image:", error)
		}
	}

	/**
	 * 将Canvas内容复制到剪贴板
	 * @param canvas Canvas元素
	 */
	private copyCanvasToClipboard(canvas: HTMLCanvasElement) {
		// 尝试使用标准Clipboard API
		canvas.toBlob((blob) => {
			if (!blob) return

			// 尝试使用标准Clipboard API
			this.tryClipboardWrite(blob).catch((error) => {
				console.warn("Standard clipboard API failed:", error)
			})
		})
	}

	/**
	 * 尝试使用标准Clipboard API
	 */
	private async tryClipboardWrite(blob: Blob): Promise<void> {
		// 确保页面有焦点
		if (document.hasFocus()) {
			await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
			return
		}
		throw new Error("Document does not have focus")
	}

	/**
	 * 复制 svg
	 * @param svgDom svg 元素
	 */
	copySvg(svgText: string) {
		// 把 svg 转换为 base64
		const base64 = btoa(svgText)
		navigator.clipboard.write([new ClipboardItem({ "image/svg+xml": base64 })])
	}
}

export default new MessageFilePreview()
