import { createStyles } from "antd-style"

export const useStyles = createStyles(({ css, isDarkMode, token, prefixCls }) => {
	return {
		container: css`
			display: flex;
			flex-direction: column;

			.${prefixCls}-spin-nested-loading {
				height: 100%;
				flex: 1;

				.${prefixCls}-spin {
					max-height: unset;
				}
			}
			.${prefixCls}-spin-container {
				display: flex;
				flex-direction: column;
				height: 100%;
			}
		`,
		avatar: css`
			border: 1px solid ${token.magicColorUsages.border};
			margin-right: 6px;
		`,
		breadcrumb: css`
			font-size: 14px;
			font-weight: 400;
			line-height: 20px;
			padding: 10px 0;
			flex-wrap: wrap;
		`,
		breadcrumbItem: css`
			cursor: pointer;
			color: ${token.magicColorUsages.text[2]};
			white-space: nowrap;
			overflow: hidden;

			&:hover {
				color: ${isDarkMode ? token.magicColorScales.brand[6] : token.colorPrimaryHover};
			}

			&:last-child {
				color: ${isDarkMode ? token.magicColorScales.brand[5] : token.colorPrimary};
			}
		`,
		list: css`
			height: calc(100% - 50px);
			display: flex;
			flex-direction: column;
			gap: 2px;
		`,
		listItem: css`
			&:hover {
				background-color: ${isDarkMode
					? token.magicColorScales.grey[1]
					: token.magicColorScales.grey[0]};
			}
			border-radius: 8px;
		`,
		selectAllWrapper: css`
			padding: 8px 10px;
		`,
		button: css`
			height: 32px;
			font-size: 14px;
			border-radius: 8px;
			padding: 6px 10px;
			background-color: ${token.magicColorScales.orange[0]};
			color: ${token.magicColorUsages.text[1]};
		`,
	}
})
