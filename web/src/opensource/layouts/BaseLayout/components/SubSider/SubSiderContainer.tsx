import { createStyles } from "antd-style"
import { Flex } from "antd"
import { memo } from "react"
import type { HTMLAttributes } from "react"

const useStyles = createStyles(({ isDarkMode, token, css }) => {
	return {
		subSider: {
			height: "100%",
			minHeight: `calc(100vh - ${token.titleBarHeight}px)`,
			width: "100%",
			padding: "10px 12px",
			background: isDarkMode ? token.magicColorUsages.bg[0] : token.magicColorUsages.white,
			borderRight: `1px solid ${token.colorBorder}`,
			position: "relative",
			userSelect: "none",
		},
		common: css`
			width: 100%;
			padding: 10px 0;
		`,
	}
})

interface SubSiderContainerProps extends HTMLAttributes<HTMLDivElement> {}

const SubSiderContainer = memo(({ children, className, ...rest }: SubSiderContainerProps) => {
	// const {width, handler} = useResizable(240, resizable, MIN_WIDTH)

	const { styles, cx } = useStyles()

	return (
		<Flex vertical align="center" className={cx(styles.subSider, className)} {...rest}>
			{children}
		</Flex>
	)
})

export default SubSiderContainer
