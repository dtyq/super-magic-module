import { createStyles } from "antd-style"

export const useStyles = createStyles(({ css, isDarkMode, token }) => ({
	container: css`
		padding: 0 16px;
		width: 100%;
	`,
	avatar: css`
		flex-shrink: 0;
		width: 40px;
		height: 40px;
	`,
	messageWrapper: css`
		max-width: 60%;
	`,
	messageInfo: css`
		padding: 0 4px;
	`,
	name: css`
		color: ${token.magicColorUsages.text[2]};
		text-align: justify;
		font-size: 12px;
		font-weight: 400;
		line-height: 16px;
		user-select: none;
	`,
	time: css`
		font-size: 12px;
		color: ${token.colorTextQuaternary};
	`,
	content: css`
		justify-content: flex-end;
		padding-right: unset;
		padding-left: 50px;
		width: 100%;
		box-sizing: border-box;
		user-select: none;
		line-height: normal;
	`,
	referContent: css`
		color: ${token.colorTextQuaternary};
		padding-left: 4px;
		border-left: 4px solid ${token.colorBorder};
		margin-bottom: 4px;
	`,
	message: css`
		width: 100%;
		border-radius: 12px;
		overflow-anchor: none;
		user-select: none;
		align-items: flex-end;
	`,
	contentInnerWrapper: css`
		width: fit-content;
		padding: 10px;
		border-radius: 12px;
		user-select: text;

		max-width: calc(100vw - 480px - var(--extra-section-width));

		@media (max-width: 964px) {
			max-width: 280px;
		}
	`,

	defaultTheme: css`
		background: ${token.magicColorUsages.bg[1]};
		color: ${token.magicColorUsages.text[1]};
		${isDarkMode ? "" : `border: 1px solid ${token.colorBorder};`}
	`,
	magicTheme: css`
		color: ${token.magicColorUsages.text[1]};
		background: ${isDarkMode ? token.magicColorUsages.primaryLight.default : "#E6F0FF"};
		// background: linear-gradient(99deg, #4768d4 0%, #6c8eff 0.01%, #ca58ff 100%);
	`,
}))
