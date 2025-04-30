import { createStyles } from "antd-style"

export const useStyles = createStyles(({ token }) => {
	return {
		container: {
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			height: "100%",
			width: "100%",
			userSelect: "none",
		},
		content: {
			width: "266px",
			height: "200px",
			display: "flex",
			flexDirection: "column",
			alignItems: "center",
			justifyContent: "center",
			borderRadius: "8px",
		},
		icon: {
			color: token.magicColorScales.grey[5],
			paddingBottom: "20px",
		},
		message: {
			fontWeight: 600,
			fontSize: "32px",
			textAlign: "center",
			color: token.magicColorUsages.text[2],
		},
		description: {
			fontSize: "14px",
			fontWeight: 400,
			textAlign: "center",
			color: token.magicColorUsages.text[2],
			marginTop: "4px",
			marginBottom: "20px",
		},
		button: {
			height: "32px",
			borderRadius: "8px",
			padding: "6px 24px",
		},
	}
})
