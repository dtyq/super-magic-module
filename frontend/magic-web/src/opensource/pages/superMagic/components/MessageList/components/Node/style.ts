import { createStyles } from "antd-style"

export const useStyles = createStyles(({ token }) => ({
	expandableNode: {
		cursor: "pointer",
		marginBottom: "4px",
	},
	defaultNode: {
		width: "100%",
		cursor: "default",
		paddingBottom: "10px",
		overflow: "hidden",
		display: "flex",
		flexDirection: "column",
		gap: "8px",
		flex: "none",
		'&[data-has-detail="true"]': {
			cursor: "pointer",
		},
	},
	userNode: {
		// paddingRight: "10px",
	},
	agentNode: {
		paddingLeft: "20px",
		borderLeft: `1px dashed ${token.magicColorScales.grey[2]}`,
		marginLeft: "5px",
		paddingRight: "20px",
	},
	finishedTextContainer: {
		marginTop: "10px",
		marginBottom: "10px",
	},
	errorTextContainer: {
		marginTop: "10px",
		marginBottom: "10px",
		backgroundColor: token.magicColorUsages.error,
		color: token.magicColorUsages.error,
		borderRadius: "100px",
		padding: "3px 8px",
		fontSize: "12px",
		fontWeight: 400,
	},
}))
