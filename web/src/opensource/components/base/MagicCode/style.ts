import { createStyles, cx, css } from "antd-style"

export const useStyles = createStyles(({ isDarkMode, prefixCls, token }) => {
	const copy = cx(css`
		padding: 6px 8px;
		height: 28px;
		position: absolute;
		right: 6px;
		top: 6px;
		border: 1px solid ${token.magicColorUsages.border};
		border-radius: 6px;
		background: ${isDarkMode ? token.magicColorScales.grey[3] : token.magicColorUsages.white};

		&:hover {
			background: ${isDarkMode
				? token.magicColorScales.grey[4]
				: token.magicColorScales.grey[1]} !important;
		}

		&:active {
			background: ${isDarkMode
				? token.magicColorScales.grey[5]
				: token.magicColorScales.grey[0]} !important;
		}

		box-shadow: 0px 4px 14px 0px rgba(0, 0, 0, 0.05), 0px 0px 1px 0px rgba(0, 0, 0, 0.15);
		gap: 4px;

		.${prefixCls}-btn-icon {
			display: flex;
			align-items: center;
			justify-content: center;
		}
	`)

	return {
		container: css`
			position: relative;
			border-radius: 8px;
			border: 1px solid ${token.magicColorUsages.border};
			background: ${isDarkMode
				? token.magicColorScales.grey[2]
				: token.magicColorUsages.white};

			pre::-webkit-scrollbar {
				display: none;
			}
		`,
		inner: {
			"> pre": {
				background: "transparent !important",
				padding: "10px 16px",
				margin: 0,
			},
		},
		raw: css`
			background: transparent !important;
			border: none !important;
			color: ${token.colorText};
			margin: 10px;
		`,
		copy,
	}
})
