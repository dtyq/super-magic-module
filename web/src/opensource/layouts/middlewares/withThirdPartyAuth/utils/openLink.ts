import dd from "dingtalk-jsapi"

/**
 * 第三方平台打开链接
 * @param url 链接
 * @param platform 平台
 */
export const thirdPartyOpenLink = (url: string, platform?: "dingtalk") => {
	switch (platform) {
		case "dingtalk":
			dd.openLink({
				url,
				onSuccess: () => {
					window.close()
				},
				onFail: () => {
					thirdPartyOpenLink(url)
				},
			})
			break
		default:
			window.open(url, "_blank")
			window.close()
	}
}
