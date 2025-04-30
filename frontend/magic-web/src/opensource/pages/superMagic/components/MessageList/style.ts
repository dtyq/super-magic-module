import MagicAva from "@/opensource/pages/superMagic/assets/svg/magicAva.svg"
import { createStyles } from "antd-style"

export const useStyles = createStyles(({ prefixCls }) => ({
	container: {
		display: "flex",
		flex: "1",
		width: "100%",
		overflow: "hidden",
		backgroundColor: "#ffffff",
	},
	nodesPanel: {
		padding: "20px",
		width: "100%",
		height: "100%",
		display: "flex",
		flexDirection: "column",
		paddingBottom: "50px",
		overflowY: "auto",
		overflowX: "hidden",
		"@media (max-width: 768px)": {
			paddingBottom: "0",
		},
		"&::-webkit-scrollbar": {
			width: "4px",
		},
		"&::-webkit-scrollbar-thumb": {
			backgroundColor: "rgba(0, 0, 0, 0.1)",
			borderRadius: "2px",
		},
		"&::-webkit-scrollbar-track": {
			backgroundColor: "transparent",
		},
	},
	chatContainer: {
		width: "100%",
		position: "relative",
	},
	chatHeader: {
		display: "flex",
		alignItems: "center",
	},
	chatContent: {
		position: "relative",
		maxWidth: "90%",
		width: "fit-content",
	},
	userChatContent: {
		display: "flex",
		justifyContent: "flex-end",
		marginLeft: "auto",
	},
	expandableNode: {
		cursor: "pointer",
		marginBottom: "4px",
	},
	taskList: {
		backgroundColor: "#f2f3f5",
		borderRadius: "4px",
		padding: "10px",
		border: "1px solid #e3e5e8",
	},
	timeline: {
		[`& .${prefixCls}-timeline-item-head`]: {
			background: "unset",
		},
		[`& .${prefixCls}-timeline-item-last`]: {
			marginBottom: 0,
			paddingBottom: 0,
		},
	},
	expandIcon: {
		width: "100%",
		color: "#747f8d",
		fontSize: "14px",
		display: "flex",
	},
	iconButton: {
		padding: 0,
		width: "24px",
		height: "24px",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		"&>span": {
			display: "flex",
			alignItems: "center",
		},
	},
	assistantAvatar: {
		backgroundImage: `url(${MagicAva})`,
		boxShadow: "none",
		borderRadius: "50%",
	},
	userAvatar: {
		boxShadow: "none",
		borderRadius: "50%",
		backgroundColor: "rgba(28, 29, 35, 0.8)",
	},
	messageWrapper: {
		display: "flex",
		width: "100%",
		alignItems: "flex-start",
		gap: "16px",
		padding: "2px 0",
		borderRadius: "0",
		margin: "0",
		"&:hover": {
			backgroundColor: "#f9f9fa",
		},
	},
	messageBubble: {
		padding: "10px",
		borderRadius: "12px",
		boxShadow: "none",
		position: "relative",
		maxWidth: "100%",
		wordBreak: "break-word",
		transition: "none",
		"&:hover": {
			boxShadow: "none",
		},
		backgroundColor: "rgba(238, 243, 253, 1)",
	},
	userMessageBubble: {
		backgroundColor: "transparent",
		color: "#313338",
		borderRadius: "0",
		"&::after": {
			display: "none",
		},
	},
	assistantMessageBubble: {
		backgroundColor: "transparent",
		border: "none",
		borderRadius: "0",
		"&::before": {
			display: "none",
		},
	},
	imagePreview: {
		maxWidth: "100%",
		maxHeight: "300px",
		marginTop: "8px",
		borderRadius: "3px",
		border: "1px solid #e3e5e8",
	},
	statusTag: {
		marginLeft: "8px",
	},
	description: {
		fontSize: "14px",
		backgroundColor: "#f2f3f5",
		border: "1px solid #e3e5e8",
		whiteSpace: "pre-wrap",
		padding: "10px 10px",
		cursor: "pointer",
		color: "#313338",
		lineHeight: "16px",
		transition: "background-color 0.1s ease",
		borderRadius: "8px",
		background: "rgba(46, 47, 56, 0.05)",
		// display: "flex",
		alignItems: "flex-start",
		gap: "8px",
		alignSelf: "stretch",

		"&:hover": {
			backgroundColor: "#e9eaeb",
		},
		"& span": {
			lineHeight: "20px",
		},
	},
	text: {
		fontWeight: 400,
		fontSize: "14px",
		lineHeight: 1.4,
		color: "#313338",
		backgroundColor: "#f2f3f5",
		borderRadius: "10px",
		marginTop: "4px",
		border: "1px solid #e3e5e8",
		padding: "3px 10px",
		whiteSpace: "pre-wrap",
	},
	messageContent: {
		fontSize: "14px",
		lineHeight: 1.4,
		color: "#313338",
		whiteSpace: "pre-wrap",
	},
	messageTime: {
		fontSize: "14px",
		color: "#747f8d",
		marginTop: "2px",
		opacity: 0.7,
	},
	messageDate: {
		fontSize: "14px",
		color: "#747f8d",
		textAlign: "center",
		margin: "21.5px 0 8px 0",
		position: "relative",
		"&::before": {
			content: '""',
			position: "absolute",
			left: 0,
			top: "50%",
			width: "calc(50% - 60px)",
			height: "1px",
			backgroundColor: "#e3e5e8",
		},
		"&::after": {
			content: '""',
			position: "absolute",
			right: 0,
			top: "50%",
			width: "calc(50% - 60px)",
			height: "1px",
			backgroundColor: "#e3e5e8",
		},
	},
	emptyContainer: {
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		height: "100%",
		padding: "20px",
	},
	emptyIcon: {
		width: "120px",
		height: "120px",
		marginBottom: "24px",
		fontSize: "80px",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
	},
	emptyTitle: {
		fontSize: "24px",
		fontWeight: "bold",
		color: "#313338",
		marginBottom: "8px",
	},
	emptyText: {
		fontSize: "16px",
		color: "#747f8d",
		textAlign: "center",
		maxWidth: "360px",
	},
	nodeHeader: {
		display: "flex",
		alignItems: "center",
		gap: "8px",
		marginBottom: "4px",
	},

	timestamp: {
		fontSize: "12px",
		color: "#999",
	},
	avatar: {
		width: "22px",
		height: "22px",
		borderRadius: "5px",
	},
}))

export default useStyles
