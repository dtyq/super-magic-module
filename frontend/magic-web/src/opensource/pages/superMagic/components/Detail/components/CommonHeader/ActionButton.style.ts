import { createStyles } from "antd-style"

// Define the styles using createStyles
export const useStyles = createStyles(({ token }) => {
	return {
		iconCommon: {
			cursor: "pointer",
			stroke: token.colorTextSecondary,
			padding: "5px",
			borderRadius: "10px",
			userSelect: "none",
			"&:hover": {
				backgroundColor: "#2E2F380D",
			},
		},
		disabled: {
			opacity: 0.5,
			cursor: "not-allowed",
		},
		contextTag: {
			fontSize: 12,
			color: token.colorTextTertiary,
			backgroundColor: token.colorFillQuaternary,
			padding: "2px 6px",
			borderRadius: token.borderRadiusSM,
			marginLeft: 8,
		},
	}
})
