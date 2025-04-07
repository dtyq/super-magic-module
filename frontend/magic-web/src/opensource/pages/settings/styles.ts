import { createStyles } from "antd-style"

export const useStyles = createStyles(({css, prefixCls, token, isDarkMode}) => {
	return {
		container: {
			flex: 1,
			position: "relative",
			height: `calc(100vh - ${ token.titleBarHeight }px)`,
			"&::-webkit-scrollbar": {
				display: "none",
			},
		},
		collapse: css`
			--${ prefixCls }-collapse-content-bg: transparent !important;
			width: 100%;
			padding: 20px;
			height: calc(100vh - ${ (token.titleBarHeight ?? 0) + 55 }px);
			overflow-y: auto;
			margin-top: 55px;
			transform: translateY(-55px);

			.${ prefixCls }-collapse-item {
				border-radius: 8px !important;
				overflow: hidden;
				border: 1px solid ${ token.colorBorder } !important;

				&:not(:last-child) {
					margin-bottom: 12px;
				}
			}

			.${ prefixCls }-collapse-header {
				background-color: ${ isDarkMode ? token.magicColorScales.grey[1] : token.magicColorScales.grey[0] };
				padding: 12px 20px;
				color: ${ token.magicColorScales.grey[1] };
				font-size: 16px;
				font-weight: 600;
				line-height: 22px;
			}

			.${ prefixCls }-collapse-content-box {
				padding: 0 !important;
				background-color: ${ isDarkMode ? token.magicColorScales.grey[0] : token.magicColorUsages.white };
			}
		`,
	}
})
