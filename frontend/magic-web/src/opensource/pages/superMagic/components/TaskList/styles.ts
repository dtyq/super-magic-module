import { createStyles, keyframes } from "antd-style"

// 创建一个更加明显的脉冲动画
const pulseAnimation = keyframes`
  0% {
    transform: scale(1);
    opacity: 0.9;
  }
  50% {
    transform: scale(1.6);
    opacity: 0.4;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
`

export const useStyles = createStyles(({ token }) => {
	const textColor = token.magicColorUsages.text[1]
	return {
		container: {
			width: "100%",
			flex: "none",
			marginBottom: "0",
			userSelect: "none",
			padding: "10px",
		},
		containerCollapsed: {
			padding: "10px 20px",
			display: "flex",
			alignItems: "center",
			gap: 4,
		},
		containerInner: {
			backgroundColor: "#f9f9f9",
			padding: 0,
			borderRadius: token.borderRadiusLG,
		},
		containerInnerView: {
			backgroundColor: token.magicColorUsages.bg[1],
		},
		containerInnerCollapsed: {
			width: "56px",
			backgroundColor: "unset",
			padding: "0px",
		},
		containerInChat: {},
		containerInnerInChat: {
			padding: "0 12px",
		},
		header: {
			display: "flex",
			justifyContent: "space-between",
			alignItems: "center",
			cursor: "pointer",
			marginBottom: "0",
			borderRadius: token.borderRadiusSM,
			borderBottom: "none",
			borderRadiusBottom: "0",
		},
		headerExpanded: {
			padding: "10px 10px 5px 10px",
		},
		headerLeft: {
			display: "flex",
			alignItems: "center",
			gap: "8px",
		},
		headerLeftCollapsed: {
			width: "100%",
			overflow: "hidden",
			flex: 1,
			paddingLeft: "0",
		},
		title: {
			fontSize: "14px",
			fontWeight: 600,
			color: textColor,
		},
		headerRight: {
			fontSize: "14px",
			color: token.colorTextSecondary,
			display: "flex",
			alignItems: "center",
			gap: 10,
		},
		taskCount: {
			marginRight: "4px",
		},
		taskList: {
			display: "flex",
			flexDirection: "column",
			gap: 10,
			maxHeight: "240px",
			overflow: "auto",
			padding: 10,
			paddingTop: 5,
		},
		taskItem: {
			display: "flex",
			alignItems: "center",
			gap: "10px",
			borderRadius: token.borderRadiusSM,
			lineHeight: "16px",
			// height: "32px",
			// background: token.colorBgElevated,
		},
		taskIcon: {
			width: "13.5px",
			height: "13.5px",
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
		},
		taskTitle: {
			flex: 1,
			fontSize: "12px",
			// color: token.colorText,
			color: token.magicColorUsages.text[1],
			overflow: "hidden",
			textOverflow: "ellipsis",
			whiteSpace: "nowrap",
			fontWeight: 400,
			lineHeight: "16px",
		},
		taskStatusDone: {
			fontSize: "14px",
			color: token.colorSuccess,
		},
		taskStatusDoing: {
			fontSize: "14px",
		},
		taskStatusError: {
			fontSize: "14px",
			color: token.colorError,
		},
		taskStatusTodo: {
			fontSize: "14px",
			color: token.colorTextSecondary,
		},
		collapseIconExpanded: {
			fontSize: "12px",
			transition: "transform 0.3s",
			transform: "rotate(180deg)",
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
		},
		collapseIconCollapsed: {
			fontSize: "12px",
			transition: "transform 0.3s",
			transform: "rotate(0deg)",
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			paddingTop: "10px",
			paddingRight: "20px",
			paddingBottom: "10px",
			paddingLeft: "20px",
		},
		statusIcon: {
			width: "13.5px",
			height: "13.5px",
			fontSize: "16px",
		},
		statusDoing: {
			color: token.colorPrimary,
		},
		statusDone: {
			width: "18px",
			height: "18px",
			color: token.colorSuccess,
		},
		statusTodo: {
			// color: token.colorTextSecondary,
			color: "green",
		},
		statusError: {
			color: token.colorError,
		},
		progressWrapper: {
			width: "100%",
			display: "flex",
			alignItems: "center",
			gap: "8px",
		},
		progressText: {
			fontSize: 12,
			color: token.magicColorUsages.text[2],
		},
		currentTaskText: {
			fontSize: "14px",
			maxWidth: "500px",
			overflow: "hidden",
			textOverflow: "ellipsis",
			whiteSpace: "nowrap",
		},
		taskStatusDefault: {
			flex: 1,
			color: token.colorText,
			fontSize: 12,
			lineHeight: "16px",
		},
		doingIconContainer: {
			position: "relative",
			width: "14px",
			height: "14px",
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
		},
		doingIconOuter: {
			position: "absolute",
			width: "14px",
			height: "14px",
			borderRadius: "50%",
			backgroundColor: "rgba(255, 236, 204, 1)",
		},
		doingIconInner: {
			position: "absolute",
			width: "8px",
			height: "8px",
			borderRadius: "50%",
			backgroundColor: "rgba(255, 125, 0, 1)",
			zIndex: 1,
		},
		doingIconPulse: {
			position: "absolute",
			width: "14px",
			height: "14px",
			borderRadius: "50%",
			backgroundColor: "rgba(255, 180, 100, 0.8)",
			animation: `${pulseAnimation} 1.5s infinite`,
			zIndex: 0,
		},
		// 默认图标样式
		defaultIconContainer: {
			position: "relative",
			width: "14px",
			height: "14px",
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
		},
		defaultIcon: {
			width: "14px",
			height: "14px",
			borderRadius: "50%",
			backgroundColor: "rgba(46, 47, 56, 0.05)",
		},
	}
})
