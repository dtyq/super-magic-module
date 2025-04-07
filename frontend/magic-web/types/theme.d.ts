import "antd-style"
import "antd/es/theme/interface"
import type { ColorScales, ColorUsages } from "@dtyq/magic-ui"

export interface NewToken {
	/** 顶部菜单栏高度 */
	titleBarHeight?: number
	magicColorScales: ColorScales
	magicColorUsages: ColorUsages
}

// 通过声明合并扩展 antd-style 的 `token` 类型
// 通过给 antd-style 扩展 CustomToken 对象类型定义，可以为 useTheme 中增加相应的 token 对象
declare module "antd-style" {
	// eslint-disable-next-line @typescript-eslint/no-empty-interface
	export interface MagicToken extends NewToken {}
}

// 扩展 antd 的 token 类型
declare module "antd/es/theme/interface" {
	export interface FullToken extends NewToken {}
	export interface AliasToken extends NewToken {}
}
