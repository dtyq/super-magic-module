import { createStyles } from "antd-style"

// Define the styles using createStyles
export const useStyles = createStyles(({ token }) => {
	return {
		detailContainer: {
			display: "flex",
			flexDirection: "column",
			height: "100%",
			overflow: "hidden",
			backgroundColor: token.colorBgContainer,
			position: "relative",
		},
		fullscreen: {
			position: "fixed",
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
			height: "100vh",
			width: "100vw",
			zIndex: 1000,
			borderRadius: 0,
		},
	}
})
