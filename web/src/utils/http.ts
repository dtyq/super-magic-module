import type { RequestUrl } from "@/opensource/apis/constant"
import { resolveToString } from "@dtyq/es6-template-strings"
import { isUndefined } from "lodash-es"

/**
 * 生成请求地址
 * @param url 请求地址模板
 * @param params 参数列表
 * @returns 请求地址
 */
export function genRequestUrl(
	url: RequestUrl | string,
	params: Record<string, string | number | null> = {},
	queries?: Record<string, string | number | null | undefined | any>,
) {
	const requestUrl = resolveToString(url, params)
	const stringifyQueries = Object.entries(queries ?? {}).reduce<string[][]>(
		(prev, [key, value]) => {
			if (!isUndefined(value)) {
				prev.push([key, `${value}`])
			}
			return prev
		},
		[],
	)

	const pars = new URLSearchParams(stringifyQueries)
	if (pars.size > 0) {
		return `${requestUrl}?${pars.toString()}`
	}
	return requestUrl
}

/**
 * 判断是否是有效的 URL
 * @param url
 * @returns
 */
export function isValidUrl(url: string) {
	return /^https?:\/\//.test(url)
}

/**
 * 判断是否是有效的 URL
 * @param text
 * @returns
 */
export function isUrl(text: string) {
	if (text.match(/\n/)) {
		return false
	}

	try {
		const url = new URL(text)
		return url.hostname !== ""
	} catch (err) {
		return false
	}
}
