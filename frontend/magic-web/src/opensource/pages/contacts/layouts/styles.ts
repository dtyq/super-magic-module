import { createStyles } from "antd-style"

export const useStyles = createStyles(({ token, css, prefixCls }) => {
	return {
		container: css`
			width: 100%;
			height: 100%;
		`,
		topBar: css`
			height: 50px;
			padding: 9px 20px;
			background-color: ${token.magicColorUsages.bg[0]};
			border-bottom: 1px solid ${token.colorBorderSecondary};
		`,
		title: css`
			color: ${token.colorTextSecondary};
			font-size: 18px;
			font-weight: 600;
			line-height: 24px;
		`,
		segmented: css`
			width: fit-content;
			border-radius: 4px;
			.${prefixCls}-segmented-item {
				border-radius: 4px;
			}
		`,
	}
})
