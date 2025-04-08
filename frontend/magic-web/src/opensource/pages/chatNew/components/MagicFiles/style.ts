import { calculateRelativeSize } from "@/utils/styles"
import { createStyles } from "antd-style"

export const useStyles = createStyles(
	({ css, token, isDarkMode }, { fontSize }: { fontSize: number }) => {
		return {
			container: css`
				cursor: pointer;
				display: flex;
				width: 340px;
				flex-direction: column;
				justify-content: center;
				align-items: flex-start;
				overflow: hidden;
				border-radius: 12px;
				border: 1px solid ${token.colorBorder};
				background: ${isDarkMode
					? token.magicColorScales.grey[1]
					: token.magicColorScales.white};
				user-select: none;
			`,
			image: css`
				border: 1px solid #d9d9d9;
				border-radius: 6px;
				overflow: hidden;
				width: fit-content;
				user-select: none;
				max-width: 200px;
			`,
			top: css`
				padding: 10px 14px;
			`,
			name: css`
				color: ${token.magicColorUsages.text[1]};
				text-align: justify;
				font-weight: 400;
				font-size: ${fontSize}px;
				line-height: ${calculateRelativeSize(20, fontSize)}px;
			`,
			size: css`
				color: ${token.magicColorUsages.text[3]};
				font-weight: 400;
				font-size: ${calculateRelativeSize(12, fontSize)}px;
				line-height: ${calculateRelativeSize(16, fontSize)}px;
			`,
			footer: css`
				width: 100%;
				border-top: 1px solid ${token.magicColorUsages.border};
				background: ${isDarkMode
					? token.magicColorScales.grey[1]
					: token.magicColorScales.white};

				> button:not(:last-child) {
					border-right: 1px solid ${token.magicColorUsages.border};
				}
			`,
			button: css`
				border-radius: 0;
				color: ${token.magicColorUsages.text[1]};
				text-align: justify;

				font-weight: 400;
				font-size: ${calculateRelativeSize(12, fontSize)}px;
				line-height: ${calculateRelativeSize(16, fontSize)}px;
			`,
		}
	},
)
