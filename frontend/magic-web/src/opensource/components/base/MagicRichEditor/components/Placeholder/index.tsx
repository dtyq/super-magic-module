import { memo } from "react"
import { useStyles } from "./styles"

export interface PlaceholderProps {
	/**
	 * 占位符文本
	 */
	placeholder: string
	/**
	 * 是否显示占位符
	 */
	show: boolean
}

/**
 * 富文本编辑器占位符组件
 *
 * 用于在编辑器为空时显示提示文本
 * 根据编辑器的焦点状态显示不同的颜色
 */
const Placeholder = memo(({ placeholder, show }: PlaceholderProps) => {
	const { styles } = useStyles()

	// 如果不显示占位符则直接返回null
	if (!show) return null

	return (
		<div
			className={styles.placeholder}
			data-testid="rich-editor-placeholder"
			style={{
				position: "absolute",
				top: -2 /* 微调后的垂直位置 */,
				left: "0.1em" /* 微调后的水平位置 */,
				padding: "0.15em" /* 添加内边距 */,
				pointerEvents: "none",
				zIndex: 0,
				color: "#bfbfbf",
			}}
		>
			{placeholder}
		</div>
	)
})

export default Placeholder
