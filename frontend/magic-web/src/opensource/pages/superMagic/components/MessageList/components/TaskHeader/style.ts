import { createStyles } from "antd-style"

export const useStyles = createStyles(() => ({
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
}))
