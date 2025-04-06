import { createStyles } from "antd-style"

export const useGroupMessageSeenPopoverStyles = createStyles(({ css, token }) => ({
	content: css`
		position: fixed;
		background-color: ${token.magicColorUsages.bg[0]};
		border-radius: 4px;
		border: 1px solid ${token.magicColorUsages.border};
		width: 360px;
		height: fit-content;
		max-height: 400px;
		border-radius: 12px;
	`,
	title: css`
		font-size: 14px;
		font-weight: 600;
		line-height: 20px;
		padding: 10px 20px;
		border-bottom: 1px solid ${token.magicColorUsages.border};
	`,
	text: css`
		color: ${token.magicColorUsages.text[0]};
		font-size: 14px;
		font-weight: 600;
		line-height: 20px;
		margin-bottom: 4px;
	`,
	section: css`
		flex: 1;
		height: 100%;
		padding: 12px;
		overflow-y: auto;
	`,
	list: css`
		max-height: 300px;
		overflow-y: auto;
	`,
	divider: css`
		width: 1px;
		max-height: 360px;
		border-left: 1px solid ${token.magicColorUsages.border};
	`,
}))
