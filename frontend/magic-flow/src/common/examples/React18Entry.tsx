/**
 * React 18 入口点示例
 *
 * 这个文件展示如何使用React 18的createRoot API来渲染应用
 */
import React from "react"
import { createRoot } from "react-dom/client"
import { MagicFlowLocaleProvider } from "../../common/provider/LocaleProvider/Provider"
import i18n from "i18next"

// 示例组件
const App = () => {
	return (
		<div>
			<h1>React 18 应用</h1>
			<p>这是使用createRoot API渲染的React 18应用</p>
		</div>
	)
}

/**
 * 使用React 18的createRoot API渲染应用
 * @param container DOM容器
 * @param i18nInstance i18n实例
 */
export function renderWithReact18(container: HTMLElement, i18nInstance: typeof i18n) {
	const root = createRoot(container)

	root.render(
		<React.StrictMode>
			<MagicFlowLocaleProvider i18nInstance={i18nInstance}>
				<App />
			</MagicFlowLocaleProvider>
		</React.StrictMode>,
	)

	return {
		unmount: () => {
			root.unmount()
		},
	}
}
