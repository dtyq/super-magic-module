import { createStyles } from "antd-style"

export const useStyles = createStyles(
	({ token, isDarkMode, css }, { isSelf }: { isSelf: boolean }) => {
		const selfBorderColor = isDarkMode
			? token.magicColorUsages.fill[1]
			: token.magicColorUsages.white
		const otherBorderColor = isDarkMode ? token.magicColorScales.grey[4] : token.colorBorder

		return {
			container: {
				borderLeft: `2px solid ${isSelf ? selfBorderColor : otherBorderColor}`,
				paddingLeft: 10,
				opacity: 0.5,
				cursor: "pointer",
				userSelect: "none",
				height: "fit-content",
				overflow: "hidden",
			},
			username: css`
				font-size: 10px;
				line-height: 12px;
			`,
			content: css`
				max-height: 30px;
				overflow-y: auto;
				overflow-x: hidden;
			`,
		}
	},
)
