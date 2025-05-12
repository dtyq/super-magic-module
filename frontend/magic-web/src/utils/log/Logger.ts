import { v4 } from "uuid"
import { userStore } from "@/opensource/models/user"
import { isDev, isProductionEnv } from "../env"
import { isDebug } from "../debug"

interface EnableConfig {
	console?: boolean
	warn?: boolean
	error?: boolean
	trace?: boolean
}

class Logger {
	private readonly traceId: string

	private readonly namespace: string

	private readonly color: string

	enableConfig: EnableConfig | undefined

	constructor(
		namespace: string,
		color: string = "green",
		enableConfig: EnableConfig | boolean = {
			console: true,
			warn: true,
			error: true,
			trace: true,
		},
	) {
		this.namespace = namespace
		this.color = color
		this.traceId = sessionStorage.getItem("traceId") ?? v4()
		sessionStorage.setItem("traceId", this.traceId)
		this.enableConfig =
			typeof enableConfig === "boolean"
				? {
						console: enableConfig,
						warn: enableConfig,
						error: enableConfig,
				  }
				: {
						console: true,
						warn: true,
						error: true,
						...enableConfig,
				  }
	}

	// 获取当前的链路追踪 ID
	getTraceId(): string {
		return this.traceId
	}

	// 记录普通日志
	log(...args: unknown[]): void {
		if ((!isProductionEnv() || isDebug()) && this.enableConfig?.console) {
			console.groupCollapsed(
				`%c [${this.namespace}] `,
				`color: white; background: ${this.color};`,
				...args,
			)
			console.trace("trace")
			console.groupEnd()
		}
	}

	warn(...args: unknown[]) {
		if ((!isProductionEnv() || isDebug()) && this.enableConfig?.warn) {
			console.groupCollapsed(
				`%c [${this.namespace} warn] `,
				"color: white; background: yellow;",
				...args,
			)
			console.trace("trace")
			console.groupEnd()
		}
	}

	error(...args: unknown[]) {
		if ((!isProductionEnv() || isDebug()) && this.enableConfig?.error) {
			console.groupCollapsed(
				`%c [${this.namespace} error] `,
				"color: white; background: red;",
				...args,
			)
			console.trace("trace")
			console.groupEnd()
		}
		const logData = {
			traceId: this.traceId,
			namespace: this.namespace,
			data: args.map((arg) => {
				if (arg instanceof Error) {
					const { stack } = arg
					if (stack) {
						const stackLines = stack?.split("\n")
						return {
							message: arg?.message,
							stackLines,
							errorLine: stackLines[1],
						}
					}
				}
				return arg
			}),
			info: {
				uId: userStore.user?.userInfo?.magic_id,
				tOrgCode: userStore.user?.teamshareOrganizationCode ?? "",
				mOrgCode: userStore.user?.organizationCode ?? "",
			},
		}
		Logger.reportLogs(logData)
	}

	trace(...args: unknown[]) {
		if ((!isProductionEnv() || isDebug()) && this.enableConfig?.trace) {
			console.groupCollapsed(
				`%c [${this.namespace} trace] `,
				"color: white; background: blue;",
				...args,
			)
			console.trace("trace")
			console.groupEnd()
		}
	}

	static reportLogs(logData: Record<string, any>): void {
		if (isDev) return
		try {
			window?.requestIdleCallback(() => {
				fetch("/log-report", {
					method: "POST",
					headers: {
						"Content-Type": "application/json", // 设置请求头，表明发送的数据是 JSON 格式
					},
					body: JSON.stringify(logData),
				})
			})
		} catch (error) {
			console.log("logger error:", error)
		}
	}
}

export default Logger
