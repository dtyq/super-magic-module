import { createStyles } from "antd-style"

export const useStyles = createStyles(({ css, token }) => ({
	container: css`
		height: 532px;
	`,
	divider: css`
		width: 1px;
		height: 100%;
		background-color: ${token.colorBorder};
	`,
	left: css`
		margin: 12px 12px 0 12px;
		height: calc(100% - 12px);
	`,
	footer: css`
		padding: 10px;
		border-top: 1px solid ${token.colorBorder};
	`,
	selectedWrapper: css`
		color: ${token.colorTextTertiary};
		padding: 8px 20px;
	`,
	selected: css`
		color: ${token.colorTextSecondary};
	`,

	panelWrapper: css`
		overflow-y: auto;
		overflow-x: hidden;
		height: 100%;
	`,
	selectItemTag: css`
		margin-bottom: 10px;
	`,
	fadeWrapper: css`
		transition:
			opacity 0.3s ease,
			max-height 0.3s ease;
		overflow: hidden;
	`,
}))
