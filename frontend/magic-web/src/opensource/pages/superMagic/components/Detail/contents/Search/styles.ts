import { createStyles } from "antd-style"

export const useStyles = createStyles(({ css, token }) => ({
	searchContainer: {
		overflow: "hidden",
		height: "100%",
		display: "flex",
		flexDirection: "column",
		backgroundColor: token.colorBgContainer,
	},

	searchHeader: {
		display: "flex",
		alignItems: "center",
		// padding: "px 10px",
		padding: 10,
		// borderBottom: `1px solid ${token.colorBorder}`,
		position: "relative",
		justifyContent: "center",
		flex: "none",
		backgroundColor: token.colorFillQuaternary,
	},

	searchInput: {
		height: 32,
		borderRadius: 1000,
		// border: "none !important",
		border: `1px solid ${token.colorBorder} !important`,
		outline: "none !important",
		boxShadow: "none !important",
		padding: "6px 20px 6px 10px",
		// backgroundColor: `${token.colorFillTertiary} !important`,
		backgroundColor: token.magicColorUsages.bg[1],
	},

	searchBody: css`
		padding: 10px;
		overflow: hidden auto;
		flex: auto;
		background-color: ${token.colorFillQuaternary};
	`,

	results: css`
		display: flex;
		flex-direction: column;
		margin-top: 10px;
	`,

	resultItem: {
		display: "flex",
		// padding: "10px 0px",
		// borderBottom: `1px solid ${token.colorBorder}`,
		backgroundColor: token.magicColorUsages.bg[1],
		marginBottom: 10,
		padding: "10px 12px",
		borderRadius: 8,

		"&:last-child": {
			// borderBottom: "none",
			// paddingBottom: 0,
			marginBottom: 0,
		},
	},

	content: {
		display: "flex",
		flexDirection: "column",
		overflow: "hidden",
		marginLeft: 8,
	},

	icon: {
		width: 16,
		height: 16,
		flex: "none",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		marginTop: 2,
	},

	iconImg: {
		width: "100%",
		height: "100%",
	},

	link: {
		textOverflow: "ellipsis",
		overflow: "hidden",
		whiteSpace: "nowrap",
		fontSize: 10,
		fontWeight: 400,
		lineHeight: "11px",
		display: "inline-block",
		marginTop: 4,
	},

	title: {
		fontWeight: 600,
		fontSize: 14,
		lineHeight: "20px",
		// color: "inherit",
		cursor: "pointer",
		textOverflow: "ellipsis",
		overflow: "hidden",
		whiteSpace: "nowrap",
		color: token.magicColorUsages.text[1],
	},

	info: {
		marginTop: 6,
		fontSize: 12,
		fontWeight: 400,
		lineHeight: "16px",
		color: token.magicColorUsages.text[2],
		display: "-webkit-box",
		WebkitLineClamp: "2",
		WebkitBoxOrient: "vertical",
		overflow: "hidden",
	},

	searchInfo: {
		color: token.magicColorUsages.text[3],
		fontSize: 12,
	},
}))
