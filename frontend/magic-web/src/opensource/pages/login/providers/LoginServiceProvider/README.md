# LoginServiceProvider

## 组件介绍

LoginServiceProvider 是一个 React Context Provider 组件，用于管理登录服务的状态和逻辑。它主要负责处理不同部署环境（公有云和私有云）下的登录流程，并提供相关的上下文数据和方法给子组件使用。

## 主要功能

-   管理登录部署环境（公有云/私有云）
-   提供登录服务实例（LoginService）给子组件
-   管理集群代码（clusterCode）状态
-   提供环境切换能力

## 数据结构

```typescript
interface LoginServiceStore {
	// 登录服务实例
	service: LoginService
	// 当前部署环境类型（公有云/私有云）
	deployment: LoginDeployment
	// 设置部署环境
	setDeployment: (deployment: LoginDeployment) => void
	// 集群代码（私有部署时使用）
	clusterCode: string | null
	// 设置集群代码
	setDeployCode: (clusterCode: string) => void
}
```

## 使用方式

### 基本使用

```tsx
import { LoginServiceProvider } from "./LoginServiceProvider"
import { LoginService } from "@/services/user/LoginService"

// 创建登录服务实例
const loginService = new LoginService(apis, serviceContainer)

function App() {
	return (
		<LoginServiceProvider service={loginService}>
			{/* 子组件可以通过 useLoginServiceContext 获取上下文 */}
			<YourLoginComponent />
		</LoginServiceProvider>
	)
}
```

### 使用 HOC 包装组件

```tsx
import { withLoginService } from "./withLoginService"
import { LoginService } from "@/services/user/LoginService"

// 创建登录服务实例
const loginService = new LoginService(apis, serviceContainer)

// 使用 HOC 包装组件
const WrappedComponent = withLoginService(YourComponent, loginService)

function App() {
	return <WrappedComponent />
}
```

### 在子组件中使用上下文

```tsx
import { useLoginServiceContext } from "./useLoginServiceContext"
import { LoginDeployment } from "@/pages/login/constants"

function LoginComponent() {
	const { service, deployment, setDeployment, clusterCode, setDeployCode } =
		useLoginServiceContext()

	const handleLogin = async () => {
		// 使用 service 进行登录操作
		// ...
	}

	const switchToPrivateDeployment = () => {
		setDeployment(LoginDeployment.PrivateDeploymentLogin)
	}

	return (
		<div>
			{/* 根据部署环境渲染不同的登录界面 */}
			{deployment === LoginDeployment.PublicDeploymentLogin ? (
				<PublicLoginForm onLogin={handleLogin} />
			) : (
				<PrivateLoginForm
					clusterCode={clusterCode}
					onSetClusterCode={setDeployCode}
					onLogin={handleLogin}
				/>
			)}

			<button onClick={switchToPrivateDeployment}>切换到私有部署登录</button>
		</div>
	)
}
```

## 注意事项

-   LoginServiceProvider 应当放置在需要访问登录服务的组件树的顶部
-   切换部署环境时会自动处理 clusterCode 的清除和恢复
-   在私有部署模式下，会从缓存中恢复上次使用的 clusterCode
