import { createStyles } from "antd-style"

export const useVectorKnowledgeCreateStyles = createStyles(({ css, token, isDarkMode }) => {
	return {
		wrapper: css`
			height: calc(100vh - 44px);
		`,
		container: css`
			height: 100%;
			overflow: hidden;
		`,
		content: css`
			flex: 1;
			width: 100%;
			padding: 24px 25%;
			overflow-y: auto;
		`,
		header: css`
			padding: 13px 20px;
			border-bottom: 1px solid ${token.colorBorder};
			font-size: 18px;
			font-weight: 600;
			color: ${isDarkMode ? token.magicColorScales.grey[9] : token.magicColorUsages.text[1]};
			background: ${isDarkMode ? "transparent" : token.magicColorUsages.white};
			height: 50px;
		`,
		arrow: css`
			border-radius: 4px;
			cursor: pointer;
			&:hover {
				background: ${isDarkMode
					? token.magicColorScales.grey[6]
					: token.magicColorScales.grey[0]};
			}
		`,
		title: css`
			font-size: 18px;
			font-weight: 600;
			padding-bottom: 10px;
			margin-bottom: 20px;
			border-bottom: 1px solid
				${isDarkMode ? token.magicColorScales.grey[8] : token.magicColorUsages.border};
		`,
		label: css`
			font-weight: 600;
		`,
		required: css`
			&::after {
				content: "*";
				padding-left: 5px;
				color: red;
			}
		`,
		uploadIcon: css`
			color: rgba(28, 29, 35);
			margin-bottom: 5px;
		`,
		uploadText: css`
			font-size: 16px;
			color: ${token.colorTextSecondary};
			font-weight: 700;
			margin-bottom: 8px;
		`,
		uploadDescription: css`
			color: ${token.colorTextSecondary};
			font-size: 12px;
		`,
		fileList: css`
			margin-top: 16px;
		`,
		fileItem: css`
			margin-top: 10px;
			padding: 12px;
			border: 1px solid rgba(28, 29, 35, 0.08);
			border-radius: 6px;
		`,
		uploadRetry: css`
			font-size: 14px;
			color: #ff4d3a;
		`,
		uploadRetryText: css`
			color: #315cec;
			cursor: pointer;
		`,
		footer: css`
			width: 100%;
			padding: 24px 25%;
		`,
		backButton: css`
			padding: 0 24px;
			background: none;
			color: rgba(28, 29, 35, 0.6);
		`,
	}
})
