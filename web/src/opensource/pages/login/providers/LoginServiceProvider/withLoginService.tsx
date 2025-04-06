import type { LoginService } from "@/opensource/services/user/LoginService"
import type { ComponentType, ReactElement } from "react"
import { LoginServiceProvider } from "./LoginServiceProvider"

/** Advanced component decorator, endowing components with specific services */
export function withLoginService<P extends object = {}>(
	WrapperComponent: ComponentType<P>,
	service: LoginService,
): (props: P) => ReactElement {
	return (props: P) => {
		return (
			<LoginServiceProvider service={ service }>
				<WrapperComponent { ...props } />
			</LoginServiceProvider>
		)
	}
}
