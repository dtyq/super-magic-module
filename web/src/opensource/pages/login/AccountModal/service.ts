import { UserService } from "@/opensource/services/user/UserService"
import { LoginService } from "@/opensource/services/user/LoginService"
import * as globalApis from "@/apis"
import { type Container, ServiceContainer } from "@/opensource/services/ServiceContainer"
import { UserApi as openSourceUserApi, CommonApi as openSourceCommonApi } from "@/opensource/apis"
import { ConfigService } from "@/opensource/services/config/ConfigService"
/**
 * @description 创建服务实例(在完全新的react根节点实例下，需要重新实例化业务层)
 */
function createService() {
	const UserApi = openSourceUserApi
	const CommonApi = openSourceCommonApi

	const apis = {
		...globalApis,
		UserApi,
		CommonApi,
	}

	const container = new ServiceContainer()

	// 将 API 初始化延迟到实际创建服务时进行
	container.registerFactory<UserService>(
		"userService",
		(c: Container) => new UserService(apis, c),
	)

	container.registerFactory<LoginService>(
		"loginService",
		(c: Container) => new LoginService(apis, c),
	)

	container.registerFactory<ConfigService>("configService", () => new ConfigService(apis as any))

	// 获取服务实例 - 容器内部会处理异步工厂的情况
	const loginService = container.get<LoginService>("loginService")
	const userService = container.get<UserService>("userService")
	const configService = container.get<ConfigService>("configService")

	return { loginService, userService, configService }
}

export const { loginService, userService, configService } = createService()
