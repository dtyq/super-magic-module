import { t } from "i18next"
import type { FileTypeResult } from "file-type"
import { fileTypeFromStream } from "file-type"
import { IMAGE_EXTENSIONS } from "@/const/file"

const fileExtCache = new Map<string | File, FileTypeResult | undefined>()

/**
 * 获取文件扩展名
 * @param url - 文件路径或文件对象
 * @returns 文件扩展名
 */
export const getFileExtension = async (url?: string | File) => {
	if (!url) return undefined

	if (fileExtCache.has(url)) {
		return fileExtCache.get(url)
	}

	if (typeof url === "string") {
		try {
			const response = await fetch(url)
			if (!response.body) return undefined
			const res = await fileTypeFromStream(response.body)

			fileExtCache.set(url, res)

			return res
		} catch (err) {
			return undefined
		}
	}
	const res = await fileTypeFromStream(url.stream())
	fileExtCache.set(url, res)
	return res
}

/**
 * 下载文件
 * @param url - 文件路径
 * @param name - 文件名(可选)
 */
export const downloadFile = async (url?: string, name?: string, ext?: string) => {
	if (!url)
		return {
			success: false,
			message: t("FileNotFound", { ns: "message" }),
		}

	try {
		// 对于 Blob 链接,直接下载
		if (url.match(/^blob:/i)) {
			const link = document.createElement("a")
			link.href = url
			link.download = encodeURIComponent(name || "download")
			document.body.appendChild(link)
			link.click()
			document.body.removeChild(link)
			return { success: true }
		}

		const extension = ext ?? (await getFileExtension(url))?.ext ?? ""
		// 对于图片文件,使用 fetch 下载
		if (IMAGE_EXTENSIONS.includes(extension)) {
			const blob =
				extension === "svg"
					? new File([url], name || "download.svg", { type: "image/svg+xml" })
					: await (await fetch(url)).blob()
			const downloadUrl = window.URL.createObjectURL(blob)
			const link = document.createElement("a")
			link.href = downloadUrl
			// 如果没有提供文件名,从 URL 中提取
			const fileName = encodeURIComponent(name || "download")
			link.download = fileName
			document.body.appendChild(link)
			link.click()
			document.body.removeChild(link)
			window.URL.revokeObjectURL(downloadUrl)
			return { success: true }
		}

		// 对于其他文件使用原来的方式
		const link = document.createElement("a")
		link.href = url
		link.download = encodeURIComponent(name || "download")
		console.log("link.download =======> ", link)
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
		return { success: true }
	} catch (error) {
		return {
			success: false,
			message: t("DownloadFailed", { ns: "message" }),
		}
	}
}
