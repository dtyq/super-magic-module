import { UrlUtils } from "../utils"

/** 请求响应体 */
export interface ResponseData {
	status: number
	statusText: string
	headers: Headers
	data: any
}

/** 请求拦截器 */
export type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>
/** 响应拦截器 */
export type ResponseInterceptor = (response: ResponseData) => Promise<any>
/** 异常拦截器 */
export type ErrorInterceptor = (error: any) => any

export interface RequestConfig extends RequestInit {
	baseURL?: string
	url?: string
	unwrapData?: boolean
}

export class HttpClient {
	private requestInterceptors: RequestInterceptor[] = []

	private responseInterceptors: ResponseInterceptor[] = []

	private errorInterceptors: ErrorInterceptor[] = []

	private baseURL: string

	constructor(baseURL: string = "") {
		this.baseURL = baseURL
	}

	public addRequestInterceptor(interceptor: RequestInterceptor): void {
		this.requestInterceptors.push(interceptor)
	}

	public addResponseInterceptor(interceptor: ResponseInterceptor): void {
		this.responseInterceptors.push(interceptor)
	}

	public addErrorInterceptor(interceptor: ErrorInterceptor): void {
		this.errorInterceptors.push(interceptor)
	}

	public setBaseURL(baseURL: string): void {
		this.baseURL = baseURL
	}

	private getFullURL(url: string): string {
		// 如果 url 已经是完整连接情况下直接返回
		return UrlUtils.join(this.baseURL, url)
	}

	private async runRequestInterceptors(config: RequestConfig): Promise<RequestConfig> {
		return this.requestInterceptors.reduce(async (promiseConfig, interceptor) => {
			const currentConfig = await promiseConfig
			return interceptor(currentConfig)
		}, Promise.resolve(config))
	}

	private async runResponseInterceptors(response: Response): Promise<any> {
		// 首先克隆 response 对象以保留原始状态信息
		const responseForStatus = response.clone()

		// 解析 JSON 数据（只需执行一次）
		let jsonData
		try {
			jsonData = await responseForStatus.json()
		} catch (error) {
			// 处理 JSON 解析错误
			console.error("Failed to parse response as JSON:", error)
			throw error
		}

		// 将原始响应状态和解析后的数据一起传递给拦截器
		const initialValue: ResponseData = {
			status: responseForStatus.status,
			statusText: responseForStatus.statusText,
			headers: responseForStatus.headers,
			data: jsonData,
		}

		// 运行拦截器链
		return this.responseInterceptors.reduce(async (promiseResult, interceptor) => {
			const currentResult = await promiseResult
			return interceptor(currentResult)
		}, Promise.resolve(initialValue))
	}

	private async runErrorInterceptors(error: any): Promise<any> {
		const finalError = await this.errorInterceptors.reduce(
			async (promiseError, interceptor) => {
				const currentError = await promiseError
				return interceptor(currentError)
			},
			Promise.resolve(error),
		)
		return Promise.reject(finalError)
	}

	public async request<T = any>(config: RequestConfig): Promise<T> {
		try {
			const { url, ...finalConfig } = await this.runRequestInterceptors({
				...config,
				url: this.getFullURL(config.url || ""),
			})

			const response = await fetch(url!, finalConfig)
			return await this.runResponseInterceptors(response)
		} catch (error) {
			console.error("Request failed:", error)
			return this.runErrorInterceptors(error)
		}
	}

	public async get<T = any>(
		url: string,
		config?: Omit<RequestConfig, "url"> | { showMessage?: boolean },
	): Promise<T> {
		return this.request({
			...config,
			url,
			method: "GET",
		})
	}

	public async post<T = any>(
		url: string,
		data?: any,
		config?: Omit<RequestConfig, "url" | "body"> | { showMessage?: boolean },
	): Promise<T> {
		return this.request({
			...config,
			url,
			method: "POST",
			body: JSON.stringify(data),
		})
	}

	public async put<T = any>(
		url: string,
		data?: any,
		config?: Omit<RequestConfig, "url" | "body">,
	): Promise<T> {
		return this.request({
			...config,
			url,
			method: "PUT",
			body: JSON.stringify(data),
		})
	}

	public async delete<T = any>(
		url: string,
		data?: any,
		config?: Omit<RequestConfig, "url">,
	): Promise<T> {
		return this.request({
			...config,
			url,
			method: "DELETE",
			body: JSON.stringify(data),
		})
	}
}
