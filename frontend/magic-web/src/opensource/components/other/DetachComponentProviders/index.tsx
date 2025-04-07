import GlobalErrorBoundary from "@/opensource/components/fallback/GlobalErrorBoundary"
import AppearanceProvider from "@/opensource/providers/AppearanceProvider"
import ContactProvider from "@/opensource/providers/ContactProvider"
import { BrowserRouter } from "react-router-dom"

/**
 * 用于解决部分【函数式调用产】生的React节点获取不到 context 的情况
 */
export const DetachComponentProviders = ({children}: { children: React.ReactNode }) => {
	return (
		<BrowserRouter>
			<AppearanceProvider>
				<GlobalErrorBoundary>
					{/* <AuthenticationProvider> */ }
					<ContactProvider>{ children }</ContactProvider>
					{/* </AuthenticationProvider> */ }
				</GlobalErrorBoundary>
			</AppearanceProvider>
		</BrowserRouter>
	)
}
