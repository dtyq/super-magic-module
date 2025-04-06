import { createStyles } from "antd-style";

export const useStyles = createStyles(({ prefixCls, css, isDarkMode, token }) => ({
  header: css`
		--${prefixCls}-padding: 12px;
		--${prefixCls}-padding-lg: 12px;
		.${prefixCls}-drawer-header-title {
			flex-direction: row-reverse;
		}

    .${prefixCls}-drawer-close {
      margin-right: 0;
    }
	`,
  icon: css`
		background-color: ${token.magicColorScales.green[5]};
		color: white;
		border-radius: 4px;
		padding: 4px;
	`,
  mask: css`
		--${prefixCls}-color-bg-mask: transparent;
	`,
  body: css`
		background-color: ${isDarkMode ? "#141414" : token.colorWhite};
		--${prefixCls}-padding-lg: 12px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
    gap: 12px;
	`,
  memberList: css`
		overflow-y: auto;
	`,
  memberItem: css`
		width: 100%;
		padding: 12px;
		&:not(&:last-of-type) {
			border-bottom: 1px solid ${token.magicColorUsages.border};
		}
	`,
  jobTitle: css`
		color: ${token.magicColorUsages.text[3]};
		font-size: 12px;
		line-height: 16px;
	`,
  removeButton: css`
		border-radius: 8px;
		border: none;
		--${prefixCls}-color-bg-container: ${token.magicColorUsages.fill[0]};
	`,
  removeCheckedButton: css``,
}));
