import { createStyles } from "antd-style"

export const useStyles = createStyles(({ css, isDarkMode, prefixCls, token }) => {
	return {
		spin: css`
			.${prefixCls}-spin-blur {
				opacity: 1;
			}

			.${prefixCls}-spin {
				--${prefixCls}-spin-content-height: unset;
			}
		`,
		container: css`
			background-color: ${isDarkMode
				? token.magicColorUsages.black
				: token.magicColorUsages.white};
			height: 100vh;
			width: 100%;
		`,
		error: css`
			height: 100vh;
			display: flex;
			align-items: center;
			justify-content: center;
			flex-direction: column;
		`,
	}
})
