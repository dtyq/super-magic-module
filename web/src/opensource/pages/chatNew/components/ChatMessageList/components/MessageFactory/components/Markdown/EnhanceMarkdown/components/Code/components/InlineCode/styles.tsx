import { createStyles } from "antd-style"

export const useStyles = createStyles(({ css, token }) => {
	return {
		code: {
			fontWeight: 400,
			padding: "2px 4px !important",
			fontSize: "inherit !important",
		},
		mention: css`
			color: ${token.colorPrimary};
			background-color: ${token.colorBgTextHover};
			display: inline-flex;
			border-radius: 4px;
			padding: 2px 4px;
			cursor: default;
			user-select: none;
		`,
		avatar: css`
			border-radius: 50%;
			width: 14px;
			height: 14px;
		`,
		error: css`
			color: ${token.colorError};
			background-color: ${token.colorErrorBg};
			padding: 2px 4px;
			border-radius: 4px;
		`,
	}
})
