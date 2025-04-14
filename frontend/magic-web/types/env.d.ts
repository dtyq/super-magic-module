// types/env.d.ts
interface ImportMetaEnv {
	/** 当前环境 */
	readonly MAGIC_APP_ENV?: "saas-test" | "saas-pre" | "saas-prod"
	/** 是否私有化部署 */
	readonly MAGIC_IS_PRIVATE_DEPLOY?: "true" | "false"
	/** WebSocket连接地址 */
	readonly MAGIC_SOCKET_BASE_URL?: string
	/** SSO登录地址 */
	readonly MAGIC_TEAMSHARE_BASE_URL?: string
	/** 后端服务地址 */
	readonly MAGIC_SERVICE_BASE_URL?: string
	/** Keewood 后端服务地址 */
	readonly MAGIC_SERVICE_KEEWOOD_BASE_URL?: string
	/** Teamshare 后端服务地址 */
	readonly MAGIC_SERVICE_TEAMSHARE_BASE_URL?: string
	/** Teamshare 高德地图Key */
	readonly MAGIC_AMAP_KEY?: string
	/** Teamshare 高德地图Secret */
	readonly MAGIC_GATEWAY_ADDRESS?: string
	/** magic 应用 sha */
	readonly MAGIC_APP_SHA?: string
	/** magic 应用 版本 */
	readonly MAGIC_APP_VERSION?: string
	readonly MAGIC_TEAMSHARE_WEB_URL?: string
	readonly MAGIC_KEEWOOD_WEB_URL?: string
	readonly MAGIC_EDITION?: string
	/** 版权信息 */
	readonly MAGIC_COPYRIGHT?: string
	/** ICP 备案号 */
	readonly MAGIC_ICP_CODE?: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}

interface Window {
	CONFIG: ImportMetaEnv
}
