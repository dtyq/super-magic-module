/**
 * ======================== 钉钉 JS-SDK 类型 ====================================
 */
export namespace DingTalk {
	interface DTFrameDOMOptions {
		id: string
		width: number
		height: number
	}

	interface DTFrameLoginOptions {
		redirect_uri: string
		client_id: string
		scope: string
		response_type: string
		prompt: string
	}

	type DTFrameLoginSuccessCallback = (result: {
		authCode: string
		redirectUrl: string
		state: string
	}) => void

	type DTFrameLoginErrorCallback = (errorMsg: string) => void

	export type DTFrameLoginAPI = (
		domOpt: DTFrameDOMOptions,
		options: DTFrameLoginOptions,
		success: DTFrameLoginSuccessCallback,
		fail: DTFrameLoginErrorCallback,
	) => void
}
