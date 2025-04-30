import { createStyles } from "antd-style"

// Define the styles using createStyles
export const useStyles = createStyles(({ token }) => {
	return {
		commonFooter: {
			flex: "none",
			display: "flex",
			alignItems: "center",
			height: "50px",
			padding: "0px 20px",
			borderTop: `1px solid ${token.colorBorder}`,
			backgroundColor: token.magicColorUsages.bg[1],
			fontSize: "14px",
		},
		left: {
			flex: 1,
			maxWidth: "70%",
		},
		goTheLatestButton: {
			borderRadius: 4,
			fontSize: 12,
			height: 20,
			fontWeight: 400,
		},
		icon: {
			borderRadius: "50%",
			background: "linear-gradient(135deg, #FFAFC8 0%, #E08AFF 50%, #9FC3FF 100%);",
			width: "20px",
			height: "20px",
			display: "inline-flex",
			alignItems: "center",
			justifyContent: "center",
			flex: "none",
		},
		tips: {
			color: token.magicColorUsages.text[1],
			paddingLeft: "10px",
			whiteSpace: "nowrap",
		},
		remark: {
			color: token.magicColorUsages.text[1],
			whiteSpace: "nowrap",
			overflow: "hidden",
			textOverflow: "ellipsis",
		},
	}
})
