import ddEnv from "dingtalk-jsapi/lib/packages/dingtalk-javascript-env"
import { compareVersions, getDingTalkApi } from "@/opensource/plugins/dingTalkAPI"
import { Login } from "@/types/login"
import { configStore } from "@/opensource/models/config"
import type { ThirdPartyLoginStrategy } from "../../types"

/** Is it a DingTalk environment */
export function isDingTalk() {
	return ddEnv.isDingTalk
}

export const DingTalkLoginStrategy: ThirdPartyLoginStrategy = {
	/**
	 * @description DingTalk login free, obtain temporary authorization code (return third-party temporary authorization code for third-party login)
	 * @constructor
	 */
	getAuthCode: (deployCode: string): Promise<string> => {
		const { clusterConfig } = configStore.cluster
		if (!deployCode || !clusterConfig?.[deployCode]) {
			throw new Error(`Private deployment configuration exception`)
		}
		const { corpId, appKey } =
		clusterConfig?.[deployCode]?.loginConfig?.[Login.LoginType.DingTalkScanCode] || {}
		if (!corpId || !appKey) {
			throw new Error(`DingTalk environment configuration exception - ${deployCode}`)
		}
		// eslint-disable-next-line no-async-promise-executor
		return new Promise(async (resolve, reject) => {
			/** Prioritize determining whether the API usage version of DingTalk JSSDK is too low */
			const dd = await getDingTalkApi()
			if (compareVersions(dd.version ?? "", "7.0.45") < 0) {
				reject(new Error("DingTalk version is too low, please upgrade to the latest version"))
			}
			try {
				const response = await dd.requestAuthCode({
					corpId,
					clientId: appKey,
				})
				if (response?.code) {
					resolve(response?.code)
				} else {
					reject(response)
				}
			} catch (error) {
				reject(error)
			}
		})
	},
}
