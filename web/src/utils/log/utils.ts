import { last } from "lodash-es"

/**
 * @description token 编码
 * @param value
 */
function encryptValue(value: string): string | undefined {
	const temp: Array<string> = value?.split(".") ?? []
	return last(temp)
}

/**
 * @description 日志数据过滤器
 * @param logs
 */
export function transformer(logs: any): any {
	try {
		if (Array.isArray(logs)) {
			// 处理数组元素
			return logs.map((item) => transformer(item))
		}
		const newObj: { [key: string]: any } = {}
		// eslint-disable-next-line no-restricted-syntax
		for (const [key, value] of Object.entries(logs)) {
			if (
				["authorization", "token", "access_token"].includes(key) &&
				typeof value === "string"
			) {
				// 找到目标字段，加密其值
				newObj[key] = encryptValue(value)
			} else {
				// 递归处理嵌套对象
				newObj[key] = transformer(value)
			}
		}
		return newObj
	} catch (error) {
		console.error("日志处理错误", error)
	}
	return logs
}
