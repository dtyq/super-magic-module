import { createStyles } from "antd-style"

export const headerHeight = 52

export const useStyles = createStyles(() => {
	return {
		container: {
			display: "flex",
			flexDirection: "column",
			width: "100%",
			height: "100%",
			overflow: "hidden",
		},
		header: {
			// position: "fixed",
			// top: 0,
			// left: 0,
			// right: 0,
			// overflow: "hidden",
			// transition: "background-color 0.15s ease, box-shadow 0.15s ease",
			// zIndex: 1000,
		},
		headerBoxShadow: {
			backgroundColor: "white",
			boxShadow: "0px 4px 14px 0px rgba(0, 0, 0, 0.10), 0px 0px 1px 0px rgba(0, 0, 0, 0.30)",
		},
		headerContent: {
			display: "flex",
			alignItems: "center",
			// justifyContent: "space-between",
			height: headerHeight,
			padding: 10,
		},
		headerLeft: {
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			width: 32,
			height: 32,
			flex: "none",
		},
		headerCenter: {
			marginLeft: 10,
			flex: 1,
			overflow: "hidden",
			// margin: "0 10px",
		},
		headerRight: {
			width: 42,
			height: 32,
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			// flex: 1,
		},
		logo: {
			width: "100%",
			height: "100%",
		},
		menuButton: {
			width: 42,
			height: 32,
		},
		menuIcon: {
			width: 18,
			height: 18,
		},
		body: {
			flex: 1,
			overflow: "hidden",
		},
		footer: {
			flex: "none",
		},
	}
})
