import { createStyles } from "antd-style"

const useStyles = createStyles(({ css, isDarkMode, prefixCls, token }) => {
	return {
		container: css`
			width: 100%;
			user-select: none;
		`,
		segmented: css`
			z-index: 2;
			user-select: none;
			width: 100% !important;
		`,
		collapse: css`
			flex: 1;
			width: 100%;
			padding-left: 0;
			padding-right: 0;
      max-height: calc(100vh - 100px);
      overflow-y: auto;
      overflow-x: visible;
      position: relative;
			user-select: none;

      ::-webkit-scrollbar {
        display: none;
      }

      .${prefixCls}-collapse-header {
        position: sticky !important;
        background-color: ${isDarkMode ? token.magicColorUsages.bg[0] : token.colorWhite};
        z-index: 1;
        top: 0;
        user-select: none;
      }

			--${prefixCls}-collapse-header-padding: 10px 0 !important;
			--${prefixCls}-collapse-content-padding: 0 !important;

			.${prefixCls}-collapse-content-box {
				padding: 0 !important;
				user-select: none;
			}
		`,
		list: css`
			overflow-y: auto;
			margin-top: 10px;
			max-height: calc(100vh - 110px);
			user-select: none;
			width: 100%;

			::-webkit-scrollbar {
				display: none;
			}
		`,
		collapseLabel: {
			color: isDarkMode ? token.magicColorUsages.text[2] : token.magicColorUsages.text[2],
			fontSize: 14,
			fontWeight: 400,
			lineHeight: "20px",
			userSelect: "none",
		},
		moreButton: css`
			--${prefixCls}-button-text-hover-bg: ${token.magicColorUsages.fill[0]} !important;
			user-select: none;
		`,
	}
})

export default useStyles
