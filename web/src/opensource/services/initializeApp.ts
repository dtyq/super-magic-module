import { type Container, ServiceContainer } from "@/opensource/services/ServiceContainer"
import { UserService } from "@/opensource/services/user/UserService"
import * as apis from "@/apis"
import { LoginService } from "@/opensource/services/user/LoginService"
import { ConfigService } from "@/opensource/services/config/ConfigService"
import { initialApi } from "@/apis/clients/interceptor"
import { FlowService } from "./flow"

export function initializeApp() {
	const container = new ServiceContainer()

	// 将 API 初始化延迟到实际创建服务时进行
	container.registerFactory<UserService>(
		"userService",
		(c: Container) => new UserService(apis as any, c),
	)

	container.registerFactory<LoginService>(
		"loginService",
		(c: Container) => new LoginService(apis as any, c),
	)

	container.registerFactory<ConfigService>("configService", () => new ConfigService(apis as any))

	container.registerFactory<FlowService>("flowService", () => new FlowService(apis as any))

	// 获取服务实例 - 容器内部会处理异步工厂的情况
	const userService = container.get<UserService>("userService")
	const loginService = container.get<LoginService>("loginService")
	const configService = container.get<ConfigService>("configService")
	const flowService = container.get<FlowService>("flowService")

	initialApi(container)

	// 返回可供应用使用的服务实例
	return {
		userService,
		loginService,
		configService,
		flowService,
	}
}
