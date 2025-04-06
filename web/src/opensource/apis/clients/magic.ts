import { userStore } from "@/opensource/models/user"
import { env } from "@/utils/env"
import { getCurrentLang } from "@/utils/locale"
import { configStore } from "@/opensource/models/config"
import { HttpClient } from "../core/HttpClient"

export class MagicHttpClient extends HttpClient {
	constructor() {
		super(env("MAGIC_SERVICE_BASE_URL"))
		this.setupInterceptors()
	}

	private setupInterceptors() {
		// 请求拦截器
		this.addRequestInterceptor((config) => {
			const headers = new Headers(config.headers)
			// 针对 magic API请求需要将组织 Code 换成 magic 生态中的组织 Code，而非 teamshare 的组织 Code
			const magicOrganizationCode = userStore.user.organizationCode

			// 设置通用请求头
			headers.set("Content-Type", "application/json")
			headers.set("authorization", userStore.user.authorization ?? "")
			headers.set("language", getCurrentLang(configStore.i18n.language))
			headers.set("organization-code", magicOrganizationCode ?? "")

			return {
				...config,
				headers,
			}
		})

		// 响应拦截器
		// this.addResponseInterceptor(async (response) => {
		// 	if (response.status === 401) {
		// 		// accountBusiness.accountLogout()
		// 		window.history.pushState({}, "", RoutePath.Login)
		// 		throw new Error("Unauthorized")
		// 	}
		//
		// 	const jsonResponse = await response.json()
		//
		// 	if (jsonResponse?.code === UnauthorizeCode) {
		// 		// 组织异常
		// 		// userService.setMagicOrganizationCode(
		// 		// 	userStore.user.organizations?.[0]?.organization_code,
		// 		// )
		// 		window.location.reload()
		// 	}
		//
		// 	if (jsonResponse?.code !== 1000) {
		// 		if (jsonResponse?.message) {
		// 			message.error(jsonResponse.message)
		// 		}
		// 		throw jsonResponse
		// 	}
		//
		// 	return jsonResponse?.data
		// })

		// 错误拦截器
		this.addErrorInterceptor((error) => {
			console.error("Request failed:", error)
			return Promise.reject(error)
		})
	}
}

const magicClient = new MagicHttpClient()

export default magicClient
