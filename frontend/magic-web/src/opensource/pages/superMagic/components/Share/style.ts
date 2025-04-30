import { createStyles } from "antd-style"

const useStyles = createStyles(({ token, prefixCls }) => ({
	shareContainer: {
		display: "flex",
		flexDirection: "column",
		gap: 10,
	},
	top: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		padding: 10,
		cursor: "pointer",
		borderRadius: 8,
		"&:hover": {
			backgroundColor: token.colorFillTertiary,
		},
		// "&:active": {
		// 	backgroundColor: token.colorFillSecondary,
		// },
	},
	bottom: {
		marginTop: 12,
		padding: "0 10px 10px 10px",
	},
	left: {
		display: "flex",
		alignItems: "center",
	},
	right: {
		display: "flex",
		alignItems: "center",
		gap: 12,
	},
	icon: {
		width: 42,
		height: 42,
		borderRadius: "50%",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
	},
	info: {
		marginLeft: 12,
		fontWeight: 400,
	},
	title: {
		fontSize: 14,
		color: token.colorText,
	},
	description: {
		fontSize: 12,
		color: token.colorTextQuaternary,
		marginTop: 2,
	},
	checkbox: {
		[`.${prefixCls}-checkbox-inner`]: {
			width: 18,
			height: 18,
			borderRadius: "50%",
		},
	},
	internetContent: {
		width: "100%",
	},
	internetLinkWrapper: {
		display: "flex",
		backgroundColor: token.magicColorUsages.fill[0],
		borderRadius: 8,
	},
	internetLink: {
		flex: 1,
		padding: "0 6px 0 10px",
		display: "flex",
		alignItems: "center",
		overflow: "hidden",

		span: {
			overflow: "hidden",
			textOverflow: "ellipsis",
			whiteSpace: "nowrap",
		},
	},
	copyButton: {
		border: "none",
		borderTopLeftRadius: 0,
		borderBottomLeftRadius: 0,
		gap: 4,
	},
	backgroundOnlySelf: {
		backgroundColor: token.magicColorScales.green[5],
	},
	backgroundOrganization: {
		backgroundColor: token.magicColorScales.brand[5],
	},
	backgroundDepartmentOrMember: {
		backgroundColor: token.magicColorScales.teal[5],
	},
	backgroundInternet: {
		backgroundColor: token.magicColorScales.amber[5],
	},
	departmentOrMemberButton: {
		gap: 2,
	},
	passwordTitle: {
		fontSize: 12,
		fontWeight: 400,
		color: token.magicColorUsages.text[2],
	},
	password: {
		borderRadius: 8,
		border: `1px solid ${token.magicColorUsages.border[0]}`,
		backgroundColor: token.magicColorUsages.fill[0],
		height: 30,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		padding: "0 12px",
	},
	passwordInput: {
		borderRadius: 8,
		border: `1px solid var(--semi-color-border)`,
		backgroundColor: token.magicColorUsages.fill[0],
		height: 30,
		padding: "0 12px",
		width: 100,
		fontSize: 14,
		textAlign: "center",
		outline: "none",
		"&:focus": {
			borderColor: token.colorPrimary,
		},
		fontWeight: 400,
	},
	passwordError: {
		color: token.colorError,
		fontSize: 12,
	},
}))

export default useStyles
