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
				display: "block",
			},
			username: css`
				font-size: 10px;
				line-height: 12px;
			`,
			content: css`
				max-height: 30px;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
				display: -webkit-box;
				-webkit-line-clamp: 1;
				-webkit-box-orient: vertical;
			`,
		}
	},
)
