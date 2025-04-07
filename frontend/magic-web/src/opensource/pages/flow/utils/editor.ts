/**
 * 代码编辑器相关辅助方法
 */
import { loader } from "@monaco-editor/react"
import * as monaco from "monaco-editor"

/**
 * 注册代码编辑器相关
 */
export default function registerEditor() {
	loader.config({
        monaco
	})

	loader.init()
}
