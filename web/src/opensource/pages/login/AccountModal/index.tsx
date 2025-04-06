import ReactDOM from "react-dom/client"
import { App as AntdApp } from "antd"
import LoadingFallback from "@/opensource/components/fallback/LoadingFallback"
import AppearanceProvider from "@/opensource/providers/AppearanceProvider"
import GlobalErrorBoundary from "@/opensource/components/fallback/GlobalErrorBoundary"
import { BrowserRouter } from "react-router-dom"
import { ClusterProvider } from "@/opensource/providers/ClusterProvider"
import GlobalChatProvider from "@/opensource/providers/ChatProvider"
import AccountModal from "./AccountModal"

import { loginService } from "./service"
import { withLoginService } from "../providers/LoginServiceProvider"

const Account = withLoginService((props: { onClose: () => void }) => {
	return (
		<BrowserRouter>
			<LoadingFallback>
				<GlobalErrorBoundary>
					<AppearanceProvider>
						<AntdApp>
							<GlobalChatProvider>
								<AccountModal onClose={props?.onClose} />
							</GlobalChatProvider>
						</AntdApp>
					</AppearanceProvider>
				</GlobalErrorBoundary>
			</LoadingFallback>
		</BrowserRouter>
	)
}, loginService)

export default function openAccountModal() {
	const root = document.createElement("div")
	document.body.appendChild(root)
	const dom = ReactDOM.createRoot(root)

	const onClose = () => {
		dom.unmount()
		root.parentNode?.removeChild(root)
	}

	dom.render(
		<ClusterProvider>
			<Account onClose={onClose} />
		</ClusterProvider>,
	)
}
