import { createStyles } from "antd-style"

export default createStyles(({ prefixCls, css, isDarkMode, token }) => ({
	modal: css`
		.${prefixCls}-modal-body {
			padding: 0;
			overflow: hidden;
		}
	`,
	container: css`
		display: flex;
		height: 444px;
		overflow: hidden;
	`,
	left: css`
		margin: 12px 12px 0 12px;
		height: calc(100% - 12px);
	`,
	organizationListContainer: css`
		width: 360px;
		height: 100%;
		overflow: hidden;
	`,
	organizationList: css`
		height: 100%;
	`,

	fadeWrapper: css`
		transition: opacity 0.3s ease, max-height 0.3s ease;
		overflow: hidden;
	`,
	panelWrapper: css`
		overflow-y: auto;
		overflow-x: hidden;
		height: calc(100% - 60px);
	`,
	rightContainer: css`
		flex: 1;
		height: 100%;
		display: flex;
		flex-direction: column;
		border-left: 1px solid ${token.colorBorder};
		overflow: hidden;
	`,
	formContainer: css`
		flex: 1;
		overflow: auto;
		padding-bottom: 20px;
	`,
	form: css`
		padding: 8px 20px;
		.${prefixCls}-form-item .${prefixCls}-form-item-label > label::after {
			content: "";
		}
	`,
	groupAvatarTip: css`
		font-size: 12px;
		color: ${isDarkMode ? token.magicColorScales.grey[5] : token.magicColorUsages.text[3]};
	`,
	divider: css`
		--${prefixCls}-color-split: ${token.colorBorder};
	`,
	uploadButton: css`
		width: 42px;
		height: 42px;
		padding: 0;
	`,
	footer: css`
		padding: 10px 12px;
		border-top: 1px solid ${token.colorBorder};
		flex-shrink: 0;
	`,
}))
