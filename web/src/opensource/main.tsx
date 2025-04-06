import "./index.css"
// 初始化 emoji 缓存
import "@/opensource/components/base/MagicEmojiPanel/cache"
import { enableMapSet } from "immer"
// import ReactDom from "react-dom"
import { createRoot } from "react-dom/client"
import { StrictMode } from "react"
import App from "./App"
import "@/utils/polyfill"

enableMapSet()

const root = createRoot(document.getElementById("root")!)
root.render(
	<StrictMode>
		<App />
	</StrictMode>,
)

postMessage({ payload: "removeLoading" }, "*")
