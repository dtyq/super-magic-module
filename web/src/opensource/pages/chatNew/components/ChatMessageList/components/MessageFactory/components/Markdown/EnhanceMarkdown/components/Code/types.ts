/**
 * 代码渲染组件的props
 */
export interface CodeRenderProps {
	/**
	 * 代码类型
	 */
	language: string
	/**
	 * 代码数据
	 */
	data?: string

	/**
	 * 是否为行内代码
	 */
	inline?: boolean

	/**
	 * 是否正在流式
	 */
	isStreaming?: boolean
}

/**
 * 代码渲染组件
 */
export interface CodeRenderComponent {
	componentType: string
	propsParser?: (props: CodeRenderProps) => unknown
	loader: () => Promise<{
		default:
			| React.ComponentType<CodeRenderProps>
			| React.MemoExoticComponent<React.ComponentType<CodeRenderProps>>
	}>
}
