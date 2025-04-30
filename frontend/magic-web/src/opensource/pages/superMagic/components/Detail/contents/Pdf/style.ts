import { createStyles } from "antd-style"

export const useStyles = createStyles(({ token }) => {
	return {
		pdfViewer: {
			width: "100%",
			height: "100%",
			backgroundColor: token.colorBgBase,
			overflow: "auto",
			display: "flex",
			flexDirection: "column",
			alignItems: "center",
		},
		pdfContainer: {
			width: "100%",
			height: "100%",
			overflow: "auto",
			display: "flex",
			flexDirection: "column",
			alignItems: "center",
		},
		zoomIcon: {
			width: "18px",
			height: "18px",
		},
		pdfViewerContainer: {
			width: "100%",
			position: "fixed",
			bottom: "0px",
			display: "flex",
			gap: "18px",
			alignItems: "center",
			justifyContent: "center",
			padding: "18px",
			borderRadius: "4px",
			zIndex: 1000,
			cursor: "pointer",
		},
	}
})
