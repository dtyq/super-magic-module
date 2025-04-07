import type { PropsWithChildren } from "react"
import { useMemo, createContext } from "react"
import type { LoginService } from "@/opensource/services/user/LoginService"
import { LoginDeployment } from "@/opensource/pages/login/constants"
import { useClusterCode } from "@/opensource/providers/ClusterProvider"
import { useImmer } from "use-immer"
import { useDeepCompareEffect, useMemoizedFn } from "ahooks"
import { configStore } from "@/opensource/models/config"

interface LoginServiceStore extends LoginServiceProviderProps {
	deployment: LoginDeployment
	setDeployment: (deployment: LoginDeployment) => void
	clusterCode: string | null
	setDeployCode: (clusterCode: string) => void
}

interface LoginServiceProviderProps {
	service: LoginService
}

export const LoginServiceContext = createContext<LoginServiceStore>({
	deployment: LoginDeployment.PublicDeploymentLogin,
	setDeployment: () => {},
	clusterCode: null,
	setDeployCode: () => {},
	service: {} as LoginService,
})

/**
 * @description 登录下根据多环境需要切换对应的服务请求
 */
export const LoginServiceProvider = (props: PropsWithChildren<LoginServiceProviderProps>) => {
	const { service } = props
	const { clusterCode, setClusterCode } = useClusterCode()

	// 私有化部署环境名称
	const [deployment, setDeployment] = useImmer(LoginDeployment.PublicDeploymentLogin)

	const setDeployCode = useMemoizedFn((code: string) => {
		setClusterCode(code)
		if (code) {
			configStore.cluster.setClusterCodeCache(code)
		}
	})

	useDeepCompareEffect(() => {
		if (deployment === LoginDeployment.PublicDeploymentLogin) {
			setClusterCode("")
		} else {
			setClusterCode(configStore.cluster.clusterCodeCache ?? "")
		}
	}, [deployment, setClusterCode])

	const store = useMemo(() => {
		return {
			service,
			deployment,
			setDeployment,
			clusterCode,
			setDeployCode,
		}
	}, [clusterCode, deployment, setDeployCode, setDeployment, service])

	return (
		<LoginServiceContext.Provider value={store}>{props?.children}</LoginServiceContext.Provider>
	)
}
