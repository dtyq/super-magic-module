import { createStyles } from "antd-style"

const useStyles = createStyles(({ css, token }) => ({
	icon: {
		color: token.magicColorUsages.text[3],
	},
	text: css`
		color: ${token.magicColorUsages.text[3]};
		text-align: justify;
		font-size: 12px;
		font-style: normal;
		font-weight: 400;
		line-height: 16px;
	`,
	error: css`
		color: ${token.magicColorUsages.danger.default};
		text-align: justify;
		font-size: 12px;
		font-style: normal;
		font-weight: 400;
		line-height: 16px;
	`,
	resendIcon: css`
		cursor: pointer;
		fill: ${token.magicColorUsages.danger.default};
	`,
}))

export default useStyles
