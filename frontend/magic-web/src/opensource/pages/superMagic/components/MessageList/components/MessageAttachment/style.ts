import { createStyles } from "antd-style"
import { tokenizeAnsiWithTheme } from "shiki"

export const useStyles = createStyles(({ token }) => ({
	attachmentContainer: {
		width: "100%",
		display: "flex",
		flexDirection: "column",
		borderRadius: "8px",
	},
	attachmentTitleRow: {
		display: "flex",
		alignItems: "center",
		cursor: "pointer",
	},
	attachmentTitle: {
		fontSize: "14px",
		fontWeight: 500,
		color: "#313338",
		marginRight: "4px",
	},
	attachmentToggle: {
		fontSize: "12px",
		color: "#747f8d",
		padding: "0 8px",
		"&:hover": {
			color: "#313338",
		},
	},
	attachmentList: {
		display: "flex",
		flexWrap: "wrap",
		gap: "8px",
		marginTop: "8px",
	},
	attachmentItemContainer: {
		cursor: "pointer",
		width: "100%",
	},
	attachmentItem: {
		display: "flex",
		alignItems: "center",
		padding: "10px",
		borderRadius: "12px",
		transition: "all 0.3s",
		backgroundColor: "rgba(46, 47, 56, 0.05)",
		"&:hover": {
			backgroundColor: "#f0f6ff",
		},
		gap: "8px",
	},
	attachmentIcon: {
		marginRight: "8px",
		fontSize: "18px",
		color: "#747f8d",
	},
	attachmentName: {
		flex: 1,
		marginRight: "8px",
		color: "#313338",
		whiteSpace: "nowrap",
		overflow: "hidden",
		textOverflow: "ellipsis",
	},
	attachmentSize: {
		marginRight: "8px",
		color: "#747f8d",
		fontSize: "12px",
	},
	attachmentAction: {
		fontSize: "16px",
		stroke: token.magicColorUsages.text[2],
		"&:hover": {
			color: "rgba(28, 29, 35, 0.8)",
		},
	},
	threadTitleImage: {
		flex: "none",
	},
	attachmentEye: {
		cursor: "pointer",
		stroke: token.magicColorUsages.text[2],
	},
	icon: {
		width: "18px",
		height: "18px",
	},
}))
