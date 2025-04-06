import type { UploadCallBack } from "@dtyq/upload-sdk"

export interface UploadResponse {
	key: string
	name: string
	size: number
}
export interface UseUploadFilesParams<F> {
	/** 文件存储类型 */
	storageType?: "private" | "public"
	/** 上传前回调 */
	onBeforeUpload?: () => void
	/** 上传进度回调 */
	onProgress?: (file: F, progress: number) => void
	/** 上传成功回调 */
	onSuccess?: (file: F, response: UploadResponse) => void
	/** 上传失败回调 */
	onFail?: (file: F, error?: Error) => void
	/** 上传初始化回调 */
	onInit?: (file: F, tools: Pick<UploadCallBack, "cancel" | "pause" | "resume">) => void
}
export interface UploadResult {
	fullfilled: PromiseFulfilledResult<UploadResponse>[]
	rejected: PromiseRejectedResult[]
}

export interface DownloadResponse {
	download_name: string
	url: string
	path: string
	expires: number
}
