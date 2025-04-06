import UAParser from "ua-parser-js"
import CryptoJS from "@/utils/crypto"
import type { i18n } from "i18next"
import { magic } from "@/enhance/magicElectron"

/** * 是否为mac系统（包含iphone手机） * */
export const isMac = (() => {
	return /macintosh|mac os x/i.test(navigator.userAgent)
})()

/** * 是否为windows系统 * */
export const isWindows = (() => {
	return /windows|win32/i.test(navigator.userAgent)
})()

/** * 是否为移动端 * */
export const isMobile = (() => {
	return /android|ios|iphone|ipad/i.test(navigator.userAgent)
})()

/**
 * @description 获取浏览器指纹，设备信息，os, os版本等信息
 */
export async function getDeviceInfo(i18n: i18n) {
	// 平台映射
	const platformMapping = {
		DingTalk: i18n.t("device.dingTalk", { ns: "interface" }),
		kkgroup: "App",
		DingTalkAvoid: i18n.t("device.dingTalk", { ns: "interface" }),
		TeamshareWebAPP: `Teamshare {${i18n.t("device.app")}}`,
	}

	// 实例化UA解析器
	const ua = new UAParser()
	const { userAgent } = window.navigator
	const currentPlatform = Object.keys(platformMapping).find(
		(platform) => userAgent.indexOf(platform) > -1,
	)
	const { device, browser, os } = ua.getResult()

	// 组装 - 设备信息
	let deviceInfo = [
		device.vendor,
		device.model,
		`${currentPlatform ? platformMapping[currentPlatform as keyof typeof platformMapping] : ""}`,
	]
		.filter((attr) => !!attr)
		.join(" ")

	if (currentPlatform === "TeamshareWebAPP") deviceInfo = platformMapping[currentPlatform]

	// 组装 - 浏览器信息
	const browserInfo = `${browser.name} ${browser.version}`

	if (magic?.os?.getSystemInfo) {
		const systemInfo = await magic?.os?.getSystemInfo?.()
		return {
			id: systemInfo?.mac,
			name: systemInfo?.systemVersion,
			os: os.name || "",
			os_version: os.version || "",
		}
	}

	return {
		id: CryptoJS.MD5encryption(JSON.stringify(ua.getResult())),

		// 移动端/平板/platform，优先显示设备信息, 否则显示浏览器信息
		name:
			device.type === "mobile" || device.type === "tablet" || currentPlatform
				? deviceInfo || i18n.t("device.unknown")
				: browserInfo,
		os: os.name || "",
		os_version: os.version || "",
	}
}
