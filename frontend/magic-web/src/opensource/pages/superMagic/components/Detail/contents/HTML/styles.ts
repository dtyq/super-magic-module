import { createStyles } from "antd-style"

export const useStyles = createStyles(({ token }) => {
	return {
		htmlContainer: {
			display: "flex",
			flexDirection: "column",
			height: "100%",
		},
		htmlBody: {
			overflow: "hidden auto",
			flex: 1,
			backgroundColor: "white",
		},
		header: {
			backgroundColor: token.magicColorUsages.fill[0],
			paddingRight: "20px",
		},
		navigate: {
			background: "none",
			flex: 1,
		},
	}
})
