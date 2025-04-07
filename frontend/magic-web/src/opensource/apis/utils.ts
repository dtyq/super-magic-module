export class UrlUtils {
	/**
	 * 判断 URL 是否包含 host
	 * @param url - 需要判断的 URL 字符串
	 */
	static hasHost(url: string) {
		try {
			return !!new URL(url).host
		} catch {
			return url.startsWith("//")
		}
	}

	/**
	 * 安全地拼接 URL
	 */
	static join(origin: string, pathname: string): string {
		const originUrl = new URL(origin)
		const originPathname = originUrl.pathname
		const url = new URL(
			((originPathname === "/" ? "" : originPathname) + pathname) as string,
			originUrl.origin,
		)
		
		return url.toString()
	}

	/**
	 * 获取 URL 的各个部分
	 */
	static parse = (url: string) => {
		try {
			const urlObj = new URL(url)
			return {
				protocol: urlObj.protocol,
				host: urlObj.host,
				pathname: urlObj.pathname,
				search: urlObj.search,
				hash: urlObj.hash,
				isValid: true,
			}
		} catch {
			return {
				protocol: "",
				host: "",
				pathname: url,
				search: "",
				hash: "",
				isValid: false,
			}
		}
	}
	
	/**
	 * 将WebSocket连接地址转换为Socket.io连接地址
	 * @param url WebSocket连接地址
	 * @returns Socket.io连接地址
	 */
	static transformToSocketIoUrl(url: string) {
		return `${url}/socket.io/?EIO=3&transport=websocket&timestamp=${Date.now()}`
	}
}
