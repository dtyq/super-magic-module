import type { User } from "@/types/user"
import type { VerificationCode } from "@/const/bussiness"
import { genRequestUrl } from "@/utils/http"
import { shake } from "radash"
import { isNil } from "lodash-es"
import type { Login } from "@/types/login"
import { configStore } from "@/opensource/models/config"
import { RequestUrl } from "../constant"
import type { HttpClient } from "../core/HttpClient"

export interface TeamshareUserInfo {
	id: string
	real_name: string
	avatar: string
	organization: string
	description: string
	nick_name: string
	phone: string
	is_remind_change_password: boolean
	platform_type: number
	is_organization_admin: boolean
	is_application_admin: boolean
	identifications: []
	shown_identification: null
	workbench_menu_config: {
		workbench: boolean
		application: boolean
		approval: boolean
		assignment: boolean
		cloud_storage: boolean
		knowledge_base: boolean
		message: boolean
		favorite: boolean
	}
	timezone: string
	is_perfect_password: boolean
	state_code: string
	departments: {
		name: string
		level: number
		id: string
	}[][]
}

export const generateUserApi = (fetch: HttpClient) => ({
	/**
	 * @description 登录
	 * @param {Login.LoginType} type 登录类型
	 * @param {Login.SMSVerificationCodeFormValues | Login.MobilePhonePasswordFormValues} values 登录表单
	 * @returns
	 */
	login(
		type: Login.LoginType,
		values: Login.SMSVerificationCodeFormValues | Login.MobilePhonePasswordFormValues,
	) {
		return fetch.post<Login.UserLoginsResponse>("/api/v1/sessions", {
			...values,
			type,
		})
	},

	/**
	 * @description 第三方登录（钉钉登录、企业微信登录、飞书登录）
	 * @param {Login.DingtalkLoginsFormValues | Login.WechatOfficialAccountLoginsFormValues} values 登录表单
	 */
	thirdPartyLogins(
		values: Login.DingtalkLoginsFormValues | Login.WechatOfficialAccountLoginsFormValues,
	) {
		return fetch.post<Login.UserLoginsResponse>(
			genRequestUrl(RequestUrl.thirdPartyLogins),
			values,
		)
	},

	/**
	 * 获取用户设备
	 * @returns
	 */
	getUserDevices() {
		return fetch.get<User.UserDeviceInfo[]>(genRequestUrl(RequestUrl.getUserDevices))
	},

	/**
	 * 获取用户信息
	 * @returns
	 */
	getUserInfo() {
		return fetch.get<User.UserInfo>(genRequestUrl(RequestUrl.getUserInfo))
	},

	/**
	 * 获取用户账户
	 * @param {Record<string, string>} headers 请求头，由业务层决定携带哪个账号的请求头获取组织
	 * @param {string} deployCode 私有化部署Code，由业务层决定请求哪个服务
	 */
	getUserOrganizations(headers?: Record<string, string>, deployCode?: string) {
		const { clusterConfig } = configStore.cluster
		const url = !isNil(deployCode) ? clusterConfig?.[deployCode]?.services?.keewoodAPI?.url : ""

		return fetch.get<User.UserOrganization[]>(url + genRequestUrl(RequestUrl.getUserAccounts), {
			headers: headers ?? {},
		})
	},

	/**
	 * 登出某台设备
	 * @param code
	 * @param id
	 * @returns
	 */
	logoutDevices(code: string, id: string) {
		return fetch.post(genRequestUrl(RequestUrl.logoutDevices), { code, id })
	},

	/**
	 * 获取用户某种类型验证码
	 * @param type
	 * @param phone
	 * @returns
	 */
	getUsersVerificationCode(type: VerificationCode, phone?: string) {
		return fetch.post(
			genRequestUrl(RequestUrl.getUsersVerificationCode),
			shake({ type, phone }),
		)
	},

	/**
	 * 获取修改手机号验证码
	 * @param type
	 * @param phone
	 * @param state_code
	 * @returns
	 */
	getPhoneVerificationCode(type: VerificationCode, phone?: string, state_code?: string) {
		return fetch.post(
			genRequestUrl(RequestUrl.getUserVerificationCode),
			shake({ type, phone, state_code }),
		)
	},

	/**
	 * 修改密码
	 * @param code
	 * @param new_password
	 * @param repeat_new_password
	 * @returns
	 */
	changePassword(code: string, new_password: string, repeat_new_password: string) {
		return fetch.put(genRequestUrl(RequestUrl.changePassword), {
			code,
			new_password,
			repeat_new_password,
		})
	},

	/**
	 * 修改手机号
	 * @param code
	 * @param new_phone
	 * @param new_phone_code
	 * @param state_code
	 * @returns
	 */
	changePhone(code: string, new_phone: string, new_phone_code: string, state_code: string) {
		return fetch.put(genRequestUrl(RequestUrl.changePhone), {
			code,
			new_phone,
			new_phone_code,
			state_code,
		})
	},

	/**
	 * 获取天书用户信息
	 * @returns
	 */
	getTeamshareUserInfo() {
		return fetch.get<TeamshareUserInfo>(genRequestUrl(RequestUrl.getTeamshareUserInfo))
	},

	/**
	 * @description 获取公众号登录二维码
	 * @returns {Promise<{scene_value: string; ticket: string; expire_seconds: number; url: string}>}
	 */
	getWechatQrcodeTicket() {
		return fetch.get<{
			scene_value: string
			ticket: string
			expire_seconds: number
			url: string
		}>(genRequestUrl(RequestUrl.getWechatQrcodeTicket))
	},

	/**
	 * @description 获取公众号登录二维码扫码状态
	 * @param {string} sceneValue 场景值
	 * @returns {Promise<{status: string}>}
	 */
	getWechatLoginStatus(sceneValue: string) {
		return fetch.get<{
			status: string
		}>(genRequestUrl(RequestUrl.getWechatLoginStatus, {}, { scene_value: sceneValue }))
	},

	/**
	 * @description 发送手机验证码
	 * @param {object} params
	 * @param {string} params.type 验证码类型，如 account_login_bind_third_platform
	 * @param {string} params.phone 手机号
	 * @param {string} params.state_code 国家代码，如 +86
	 */
	sendSmsCode(params: { type: string; phone: string; state_code: string }) {
		return fetch.post(genRequestUrl(RequestUrl.sendSmsCode), params)
	},

	/**
	 * @description 公众号绑定手机号
	 * @param {object} params
	 * @param {string} params.phone 手机号
	 * @param {string} params.platform_type 平台类型，固定为 wechat_official_account
	 * @param {string} params.code 手机验证码
	 * @param {string} params.unionid 场景值
	 * @param {object} params.device 设备信息
	 * @returns {Promise<Login.UserLoginsResponse>}
	 */
	wechatBindAccount(params: {
		phone: string
		platform_type: string
		code: string
		unionid: string
		device: {
			id: string
			name: string
			os: string
			os_version: string
		}
	}) {
		return fetch.post<Login.UserLoginsResponse>(
			genRequestUrl(RequestUrl.wechatBindAccount),
			params,
			{
				showErrorMessage: false,
			},
		)
	},
})
