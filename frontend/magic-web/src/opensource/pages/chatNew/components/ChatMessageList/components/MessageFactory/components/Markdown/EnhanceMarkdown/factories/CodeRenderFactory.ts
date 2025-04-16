import { CodeRenderProps } from "../components/Code/types"
import { LazyExoticComponent, ComponentType, lazy } from "react"
import CodeComponents from "../components/Code/config/CodeComponents"
import BaseRenderFactory from "./BaseRenderFactory"

const Fallback = lazy(() => import("../components/Code/components/Fallback"))
const InlineCode = lazy(() => import("../components/Code/components/InlineCode"))

class CodeRenderFactory extends BaseRenderFactory<CodeRenderProps> {
	constructor() {
		super(CodeComponents)
	}

	/**
	 * 获取默认组件
	 * @returns 默认组件
	 */
	public getFallbackComponent(): LazyExoticComponent<ComponentType<CodeRenderProps>> {
		return Fallback
	}

	/**
	 * 获取行内代码组件
	 * @returns 行内代码组件
	 */
	getInlineComponent(): LazyExoticComponent<ComponentType<CodeRenderProps>> {
		return InlineCode
	}
}

export default new CodeRenderFactory()
