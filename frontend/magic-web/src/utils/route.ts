/**
 * 替换路由参数
 *
 * @param route 路由
 * @param params 参数
 * @returns 带参数值路由
 */
export const replaceRouteParams = (route: string, params: Record<string, string>) => {
	const reg = /:([^/]+)/g
	return route.replace(reg, (_, key) => params[key])
}

/**
 * 打开新标签
 * @param url 跳转地址
 */
export const openNewTab = (url?: string, base?: string) => {
	if (!url) return
	window.open(base ? `${base}${url}` : url, "_blank")
}

/**
 * 获取携带新参数的 url
 * @param query
 * @returns
 */
export const getUrlWithNewSearchQuery = (url: string, query: Record<string, string>) => {
	const querys = new URLSearchParams(window.location.search)

	Object.entries(query).forEach(([key, value]) => {
		querys.append(key, value)
	})

	return `${url}?${querys.toString()}`
}
