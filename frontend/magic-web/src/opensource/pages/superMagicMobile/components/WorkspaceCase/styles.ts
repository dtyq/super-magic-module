import { createStyles } from "antd-style"

export const useStyles = createStyles(({ token }) => {
	return {
		container: {
			display: "flex",
			flexDirection: "column",
			alignItems: "center",
			position: "relative",
		},
		list: {
			width: "100dvw",
			overflow: "auto hidden",
			padding: "20px 0 30px 0",
			"&::-webkit-scrollbar": {
				display: "none",
			},
		},
		listContent: {
			display: "inline-flex",
			justifyContent: "center",
			minWidth: "100%",
			padding: "0 20px",
		},
		item: {
			flex: "none",
			padding: 14,
			width: "25dvh",
			height: "25dvh",
			maxHeight: 200,
			maxWidth: 200,
			position: "relative",
			borderRadius: 8,
			backgroundColor: "white",
			boxShadow: "0px 4px 14px 0px rgba(0, 0, 0, 0.10), 0px 0px 1px 0px rgba(0, 0, 0, 0.30)",
			overflow: "hidden",
			transition: "transform 0.3s ease-in-out",

			"&:not(:last-child)": {
				marginRight: 20,
			},

			"&:active": {
				outline: `1px solid ${token.colorPrimary}`,
				transform: "translateY(-10px)",
			},
		},
		title: {
			fontSize: 14,
			fontWeight: 600,
			lineHeight: "20px",
			textOverflow: "ellipsis",
			overflow: "hidden",
			whiteSpace: "nowrap",
		},
		description: {
			marginTop: 10,
			fontSize: 12,
			fontWeight: 400,
			fontsize: "16px",
			display: "-webkit-box",
			WebkitLineClamp: "4",
			WebkitBoxOrient: "vertical",
			overflow: "hidden",
		},
		image: {
			width: "90.9%",
			height: "58.1%",
			transform: "rotate(-15deg)",
			position: "absolute",
			right: "-1.5%",
			bottom: "-32.5%",
			borderRadius: 2,
			boxShadow: "0px 4px 14px 0px rgba(0, 0, 0, 0.10), 0px 0px 1px 0px rgba(0, 0, 0, 0.30)",
		},
		scrollbar: {
			position: "absolute",
			bottom: 0,
			left: "50%",
			transform: "translateX(-50%)",
		},
	}
})
