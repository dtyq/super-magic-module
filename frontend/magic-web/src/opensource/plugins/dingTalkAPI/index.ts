/** 按需加载 dingTalk 插件 */
export async function getDingTalkApi(): Promise<typeof import("dingtalk-jsapi")> {
	return import("dingtalk-jsapi")
}

/**
 * 比较两个版本号
 * @param version1 版本号1
 * @param version2 版本号2
 * @returns {number}
 * - 1: version1 > version2
 * - -1: version1 < version2
 * - 0: version1 = version2
 */
export function compareVersions(version1: string, version2: string): number {
	// 清理版本号字符串，移除可能的前缀（如 'v'）
	const v1 = version1.replace(/^v/, "")
	const v2 = version2.replace(/^v/, "")

	// 将版本号分割为数组
	const v1Parts = v1.split(".").map(Number)
	const v2Parts = v2.split(".").map(Number)

	// 确保两个数组长度相同
	const maxLength = Math.max(v1Parts.length, v2Parts.length)
	while (v1Parts.length < maxLength) v1Parts.push(0)
	while (v2Parts.length < maxLength) v2Parts.push(0)

	// 逐位比较
	for (let i = 0; i < maxLength; i += 1) {
		if (v1Parts[i] > v2Parts[i]) return 1
		if (v1Parts[i] < v2Parts[i]) return -1
	}

	return 0
}
