import { CodeLanguage } from "./const"
import { CodeRenderComponent, CodeRenderProps } from "./types"
import { LazyExoticComponent, ComponentType, lazy } from "react"
import CodeComponents from "./config/CodeComponents"
class CodeRenderFactory {
	/**
	 * 代码组件
	 */
	private codeComponents = new Map<string, CodeRenderComponent>()

	/**
	 * 组件缓存
	 */
	private componentCache = new Map<string, LazyExoticComponent<ComponentType<CodeRenderProps>>>()

	constructor() {
		this.codeComponents = new Map<string, CodeRenderComponent>(Object.entries(CodeComponents))
	}

	/**
	 * 获取默认组件
	 * @returns 默认组件
	 */
	private getFallbackComponent(): LazyExoticComponent<ComponentType<CodeRenderProps>> {
		return lazy(() => import("./components/Fallback"))
	}

	/**
	 * 获取行内代码组件
	 * @returns 行内代码组件
	 */
	getInlineComponent(): LazyExoticComponent<ComponentType<CodeRenderProps>> {
		return lazy(() => import("./components/InlineCode"))
	}

	/**
	 * 注册组件
	 * @param lang 语言
	 * @param componentConfig 组件配置
	 */
	registerComponent(lang: string, componentConfig: CodeRenderComponent) {
		this.codeComponents.set(lang, componentConfig)
	}

	/**
	 * 获取组件
	 * @param type 组件类型
	 * @returns 组件
	 */
	getComponent(type: CodeLanguage): LazyExoticComponent<ComponentType<CodeRenderProps>> {
		// 加载并返回组件
		const codeComponent = this.codeComponents.get(type)

		// 检查缓存
		if (codeComponent && this.componentCache.has(codeComponent.componentType)) {
			return this.componentCache.get(codeComponent.componentType)!
		}

		// 没有加载器
		if (!codeComponent?.loader) {
			return this.getFallbackComponent()
		}

		// 创建 lazy 组件
		const LazyComponent = lazy(() =>
			codeComponent.loader().then((module) => ({
				default: module.default as ComponentType<CodeRenderProps>,
			})),
		)
		this.componentCache.set(codeComponent.componentType, LazyComponent)
		return LazyComponent
	}

	/**
	 * 清除缓存
	 * @param usedTypes 使用过的类型
	 */
	cleanCache(usedTypes: string[]) {
		Array.from(this.componentCache.keys()).forEach((type) => {
			if (!usedTypes.includes(type)) {
				this.componentCache.delete(type)
			}
		})
	}
}

export default new CodeRenderFactory()
