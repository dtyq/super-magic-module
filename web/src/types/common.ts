import type { Login } from "@/types/login"

export namespace Common {
	export interface InternationalizedSettingsResponse {
		languages: Array<{
			name: string
			locale: string
			translations: Record<string, string>
		}>
		phone_area_codes: Array<{
			code: string
			name: string
			locale: string
			translations: Record<string, string>
		}>
	}

	/** 私有化登录 - 第三方登录数据（静默登录、扫码登录） */
	interface PrivateConfigSignInValues {
		enable: boolean
		/** App Id */
		appId?: string
		/** App Key */
		appKey?: string
		/** App Secret */
		appSecret?: string
		/** 重定向地址 */
		redirectUrl?: string
		/** 钉钉组织ID */
		corpId?: string
	}

	/** 私有化登录 - 服务配置 */
	interface ServiceConfig {
		/** 服务地址 */
		url?: string
	}

	/** 私有化部署配置 */
	export interface PrivateConfig {
		/** 私有化部署专属码 */
		deployCode: string
		/** 当前环境名称 */
		name?: string
		/** 微应用/微服务（teamshare、keewood、magic等服务中http、websocket等配置） */
		services: Record<string, ServiceConfig>
		/** 第三方登录 */
		loginConfig?: Record<Login.LoginType, PrivateConfigSignInValues>
	}
}
