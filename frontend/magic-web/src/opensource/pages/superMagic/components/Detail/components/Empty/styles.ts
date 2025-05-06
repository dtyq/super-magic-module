import { createStyles } from "antd-style"

// Define the styles using createStyles
export const useStyles = createStyles(({ css, token }) => {
	return {
		emptyContainer: {
			display: "flex",
			flexDirection: "column",
			height: "100%",
			overflow: "hidden",
			backgroundColor: token.colorBgContainer,
		},

		emptyHeader: {
			position: "relative",
			height: "40px",
			flex: "none",
			display: "flex",
			justifyContent: "flex-end",
			alignItems: "center",
			borderBottom: `1px solid ${token.colorBorderSecondary}`,
			backgroundColor: "rgba(249, 249, 249, 1)",
			padding: "12px 16px",
			"& h2": {
				margin: 0,
				fontSize: "14px",
				fontWeight: "400",
			},
		},

		title: {
			position: "absolute",
			left: "50%",
			top: "50%",
			transform: "translate(-50%, -50%)",
		},

		emptyBody: {
			position: "relative",
			flex: "auto",
			overflow: "hidden",
		},

		emptyContent: css`
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
			height: 100%;
			padding: 20px;

			img {
				max-width: 120px;
				height: auto;
			}

			p {
				margin-top: 16px;
				font-size: 12px;
				color: ${token.colorTextSecondary};
				text-align: center;
			}
		`,
	}
})
