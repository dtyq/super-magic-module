import { createStyles } from "antd-style"

export const useStyles = createStyles(({ token }) => {
	return {
		container: {
			height: "100%",
			overflow: "hidden auto",
			backgroundColor: token.magicColorScales.grey[0],
		},
		workspaceItem: {
			backgroundColor: "white",
			display: "flex",
			flexDirection: "column",
			"&:not(:last-child)": {
				borderBottom: `1px solid ${token.magicColorUsages.border}`,
			},
		},
		workspaceItemActive: {
			backgroundColor: "transparent",
		},
		workspaceContent: {
			padding: "4px 12px 10px 12px",
		},
		info: {
			display: "flex",
			alignItems: "center",
			justifyContent: "space-between",
			height: 44,
			gap: 6,
			flex: "none",
			padding: "4px 12px",
			"&:active": {
				backgroundColor: token.magicColorUsages.fill[0],
			},
		},
		name: {
			flex: "auto",
			fontSize: 14,
			fontWeight: 400,
			lineHeight: "20px",
		},
		nameActive: {
			fontWeight: 600,
			color: "black",
		},
		topicContainer: {
			display: "flex",
			flexDirection: "column",
			gap: 4,
		},
		topicItem: {
			display: "flex",
			alignItems: "center",
			height: 36,
			padding: "4px 12px 4px 4px",
			gap: 4,
			borderRadius: 8,
			"&:active": {
				backgroundColor: token.magicColorUsages.fill[0],
			},
		},
		topicItemActive: {
			backgroundColor: token.magicColorUsages.primaryLight.default,
		},
		topicItemName: {
			fontSize: 14,
			fontWeight: 400,
			lineHeight: "20px",
			flex: "auto",
		},
		workspaceButtons: {
			display: "flex",
			gap: 10,
			alignItems: "center",
			marginBottom: 8,
		},
		addTopicButton: {
			flex: "auto",
			height: 32,
			fontSize: 14,
			fontWeight: 400,
			lineHeight: "20px",
			backgroundColor: `${token.magicColorUsages.fill[0]} !important`,
			"&:active": {
				backgroundColor: `${token.magicColorUsages.fill[1]} !important`,
			},
			"& > span": {
				display: "flex",
				gap: 4,
				alignItems: "center",
			},
		},
		settingsButton: {
			height: 32,
			width: 32,
			backgroundColor: token.magicColorUsages.fill[0],
			"&:active": {
				backgroundColor: token.magicColorUsages.fill[1],
			},
		},
		current: {
			fontSize: 12,
			fontWeight: 400,
			color: token.magicColorScales.brand[4],
		},
		success: {
			stroke: token.colorSuccess,
		},
		running: {
			stroke: token.colorWarning,
		},
		empty: {
			stroke: token.colorTextTertiary,
		},
	}
})
