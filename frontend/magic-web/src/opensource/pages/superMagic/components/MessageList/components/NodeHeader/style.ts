import { createStyles } from "antd-style"

export const useStyles = createStyles(({ token }) => ({
	nodeHeader: {
		display: "flex",
		alignItems: "center",
		marginBottom: "10px",
	},
	userNodeHeader: {
		display: "flex",
		alignItems: "center",
		justifyContent: "flex-end",
		marginBottom: "10px",
	},
	avatar: {
		width: "36px",
		height: "36px",
		borderRadius: "4px",
	},
	timestamp: {
		fontSize: 12,
		fontWeight: 400,
		color: token.magicColorUsages.text[3],
		margin: "0 10px",
	},
}))
