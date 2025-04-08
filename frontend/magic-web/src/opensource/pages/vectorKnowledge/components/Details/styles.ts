import { createStyles } from "antd-style"

export const useVectorKnowledgeDetailStyles = createStyles(
	({ css, token, isDarkMode, prefixCls }) => {
		return {
			wrapper: css`
				height: calc(100vh - 44px);
			`,
			leftContainer: css`
				min-width: 250px;
				border-right: 1px solid
					${isDarkMode ? token.magicColorScales.grey[8] : token.magicColorUsages.border};
			`,
			rightContainer: css`
				flex: 1;
				height: 100%;
				padding: 20px;
				overflow-x: auto;
			`,
			header: css`
				padding: 13px 20px;
				border-bottom: 1px solid ${token.colorBorder};
				font-size: 18px;
				font-weight: 600;
				color: ${isDarkMode
					? token.magicColorScales.grey[9]
					: token.magicColorUsages.text[1]};
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
				font-size: 16px;
				font-weight: 600;
			`,
			subTitle: css`
				margin: 6px 0 10px;
				font-size: 14px;
				color: rgba(28, 29, 35, 0.6);
			`,
			searchBar: css`
				width: 20%;
				min-width: 200px;
			`,
			batchOperation: css`
				padding: 0 12px;
				cursor: pointer;
				color: ${token.colorTextSecondary};
				border: 1px solid rgba(28, 29, 35, 0.08);
				border-radius: 6px;
			`,
			deleteText: css`
				color: #ff4d3a;
			`,
			tableContainer: css`
				margin-top: 12px;
				flex: 1;
				overflow: hidden;

				.${prefixCls}-table-container {
					border-bottom: 1px solid ${token.colorBorder};
				}

				.${prefixCls}-table-thead .${prefixCls}-table-cell {
					background-color: #f9f9f9;
					font-weight: 500;
				}

				.${prefixCls}-tag {
					font-weight: 500;
				}
			`,
			fileTypeIcon: css`
				margin-right: 8px;
				vertical-align: middle;
			`,
			statusTag: css`
				border-radius: 4px;
			`,
			operationButton: css`
				width: 30px;
				height: 30px;
				cursor: pointer;
				border-radius: 4px;

				&:hover {
					background: rgba(46, 47, 56, 0.05);
				}
			`,
		}
	},
)
