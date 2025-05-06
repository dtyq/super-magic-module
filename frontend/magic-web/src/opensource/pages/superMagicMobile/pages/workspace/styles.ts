import { createStyles } from "antd-style"

export const useStyles = createStyles(({ token }) => {
	return {
		container: {
			height: "100%",
			overflow: "hidden",
			// backgroundImage: `url(${background})`,
			// backgroundRepeat: "no-repeat",
			// backgroundPosition: "center top",
			// backgroundAttachment: "fixed",
			// backgroundSize: "1072px 666.5px",
		},
		chatMode: {
			height: "100%",
			width: "100%",
			overflow: "hidden",
			// overflow: "unset",
		},
		loading: {
			position: "fixed",
			top: "50%",
			left: "50%",
			transform: "translate(-50%, -50%)",
		},
		menuItemDanger: {
			color: token.magicColorUsages.danger.default,
		},
		menuItemIconDanger: {
			stroke: token.magicColorUsages.danger.default,
		},
		popupHeader: {
			padding: "16px",
			display: "flex",
			justifyContent: "flex-end",
		},
		closeButton: {
			cursor: "pointer",
			fontSize: "16px",
		},
		divider: {
			height: "1px",
			background: "#f5f5f5",
			margin: "0 16px",
		},
		popupBody: {
			width: "80vw",
			padding: "16px",
			backgroundColor: "#fff",
		},
	}
})
