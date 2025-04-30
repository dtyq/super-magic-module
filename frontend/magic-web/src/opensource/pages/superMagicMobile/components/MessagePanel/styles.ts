import { createStyles } from "antd-style"

export const useStyles = createStyles(({ token }) => {
	return {
		container: {
			width: "100%",
			borderRadius: 8,
			boxShadow: "0px 4px 14px 0px rgba(0, 0, 0, 0.10), 0px 0px 1px 0px rgba(0, 0, 0, 0.30)",
			backgroundColor: "white",
			display: "flex",
			flexDirection: "column",
			overflow: "hidden",
		},
		task: {
			borderBottom: `1px solid ${token.colorBorder}`,
			flex: "none",
			overflow: "hidden",
		},
		panelContainer: {
			padding: 10,
			flex: "auto",
			overflow: "hidden",
		},
		textarea: {
			resize: "none",
			border: "none",
			outline: "none",
			padding: 0,
			margin: 0,
			width: "100%",
			fontSize: 14,
			lineHeight: "20px",
			color: "black",
			height: 120,
			"@media (max-width: 768px)": {
				height: 60,
			},
		},
		buttons: {
			width: "100%",
			marginTop: 10,
			display: "flex",
			justifyContent: "space-btween",
		},
		left: {
			flex: "auto",
			display: "flex",
			gap: 10,
			alignItems: "center",
			overflow: "hidden",
		},
		right: {
			flex: "none",
			display: "flex",
			alignItems: "center",
			gap: 10,
		},
		button: {
			flex: "none",
			height: "32px !important",
			padding: "0 6px !important",
			"& > span": {
				display: "inline-flex",
				gap: 2,
			},
		},
		sendButton: {
			height: "32px !important",
			padding: "0 12px !important",
			backgroundColor: `${token.magicColorUsages.primary.default} !important`,
			color: "white !important",
			svg: {
				stroke: "white",
			},
			"& > span": {
				display: "inline-flex",
				gap: 4,
			},
			"&.adm-button-disabled": {
				backgroundColor: `${token.magicColorUsages.disabled.bg} !important`,
				color: `${token.magicColorUsages.disabled.text} !important`,
				svg: {
					stroke: token.magicColorUsages.disabled.text,
				},
			},
		},
		singleTask: {
			padding: "10px 20px 10px 0px",
			display: "flex",
			alignItems: "center",
			overflow: "hidden",
			width: "100%",
			"&:active": {
				backgroundColor: token.magicColorUsages.fill[0],
			},
		},
		singleTaskItem: {
			overflow: "hidden",
			paddingLeft: "20px",
		},
		singleTaskProcess: {
			marginLeft: 10,
		},
		taskItem: {
			flex: "auto",
		},
		multiTask: {
			padding: 10,
		},
		multiTaskContent: {
			backgroundColor: "#F9F9F9",
			borderRadius: 8,
			padding: 10,
			display: "flex",
			flexDirection: "column",
			gap: 10,
		},
		multiTaskHeader: {
			display: "flex",
			alignItems: "center",
			justifyContent: "space-between",
			height: 20,
		},
		multiTaskName: {
			fontWeight: 600,
			fontSize: 14,
			lineHeight: "20px",
			color: token.magicColorUsages.text[1],
		},
		stopButton: {
			width: 32,
			height: 32,
			display: "inline-flex",
			alignItems: "center",
			justifyContent: "center",
			borderRadius: "50%",
			position: "relative",
			"&:active": {
				opacity: 0.5,
			},
		},
		stopShadow: {
			backgroundColor: token.magicColorUsages.fill[1],
			position: "absolute",
			top: "50%",
			left: "50%",
			transform: "translate(-50%, -50%)",
			width: 30,
			height: 30,
			borderRadius: "50%",
			"&::before, &::after": {
				content: '""',
				position: "absolute",
				top: "50%",
				left: "50%",
				transform: "translate(-50%, -50%)",
				width: 26,
				height: 26,
				borderRadius: "50%",
				backgroundColor: token.magicColorUsages.fill[1],
				animation: "ripple 2s infinite",
			},
			"&::after": {
				animationDelay: "0.5s",
			},
			"@keyframes ripple": {
				"0%": {
					transform: "translate(-50%, -50%) scale(0.8)",
					opacity: 1,
				},
				"100%": {
					transform: "translate(-50%, -50%) scale(1.2)",
					opacity: 0,
				},
			},
		},
		stopIcon: {
			width: 10,
			height: 10,
			borderRadius: 2,
			backgroundColor: token.magicColorUsages.text[2],
		},
	}
})
