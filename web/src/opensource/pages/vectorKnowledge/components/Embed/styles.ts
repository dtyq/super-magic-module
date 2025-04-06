import { createStyles } from "antd-style"

export const useVectorKnowledgeEmbedStyles = createStyles(({ css, token, isDarkMode }) => {
	return {
		container: css`
			height: 100%;
			max-width: 900px;
			min-width: 600px;
			margin: 0 auto;
			padding-bottom: 20px;
			overflow: hidden;
		`,
		header: css`
			padding: 40px 0 20px;
		`,
		headerTitle: css`
			font-size: 20px;
			font-weight: 600;
			margin-bottom: 18px;
		`,
		knowledgeInfo: css`
			display: flex;
			align-items: center;
			gap: 12px;
		`,
		knowledgeIcon: css`
			width: 40px;
			height: 40px;
			border-radius: 6px;
		`,
		knowledgeDetail: css``,
		knowledgeLabel: css`
			font-size: 12px;
			margin-bottom: 4px;
		`,
		knowledgeName: css`
			font-size: 14px;
			font-weight: 500;
		`,
		fileList: css`
			flex: 1;
			overflow: hidden;
		`,
		fileListContent: css`
			max-height: 100%;
			padding: 0 14px;
			background-color: rgba(46, 47, 56, 0.05);
			border-radius: 6px;
			overflow-y: auto;
		`,
		statusSection: css`
			padding: 12px 0;
		`,
		statusInfo: css`
			display: flex;
			align-items: center;
			gap: 8px;
			font-size: 16px;
			font-weight: 500;
		`,
		fileItem: css`
			padding: 12px;
			background-color: #fff;
			border: 1px solid rgba(28, 29, 35, 0.08);
			border-radius: 6px;
			margin-bottom: 10px;
		`,
		fileInfo: css`
			display: flex;
			align-items: center;
			gap: 8px;
		`,
		icon: css`
			vertical-align: middle;
		`,
		empty: css`
			padding: 12px;
			text-align: center;
		`,
	}
})
