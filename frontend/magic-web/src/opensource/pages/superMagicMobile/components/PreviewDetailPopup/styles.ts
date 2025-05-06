import { createStyles } from "antd-style"

export const useStyles = createStyles(() => {
	return {
		popupBody: {
			borderRadius: 12,
			borderBottomRightRadius: 0,
			borderBottomLeftRadius: 0,
			display: "flex",
			flexDirection: "column",
			overflow: "hidden",
		},
		header: {
			display: "flex",
			alignItems: "center",
			justifyContent: "space-between",
			gap: 10,
			height: 44,
			flex: "none",
			padding: "10px 12px",
		},
		body: {
			flex: "auto",
			overflow: "hidden auto",
		},
		title: {
			fontSize: 18,
			fontWeight: 600,
			lineHeight: "24px",
		},
		close: {
			flex: "none",
		},
		closeButton: {
			width: `24px !important`,
			height: `24px !important`,
		},
	}
})
