import { createStyles } from "antd-style"

export default createStyles(({ css, isDarkMode, prefixCls, token }) => ({
	container: css``,
	groupAvatar: css`
		padding: 2.5px;
		box-sizing: content-box;
	`,
	groupInfo: css`
		padding: 0 10px;
	`,
	groupName: css`
		color: ${token.colorText};
		text-align: left;
		font-size: 14px;
		font-weight: 600;
		line-height: 20px;
	`,
	groupNotice: css`
		color: ${token.colorTextQuaternary};
		font-size: 12px;
		font-weight: 400;
		line-height: 16px;
	`,
	memberSection: css`
		background-color: ${isDarkMode ? "#161616" : token.magicColorScales.grey[0]};
		padding: 10px;
		border-radius: 10px;
		width: 100%;
		margin: 0;
	`,
	member: css`
		cursor: pointer;
		margin: 3px;
	`,
	addMember: css`
		--${prefixCls}-control-height: 45px;
    color: ${token.magicColorUsages.text[1]};
    background-color: ${token.magicColorUsages.fill[0]} !important;

    &:hover {
      background-color: ${token.magicColorUsages.fill[1]} !important;
    }

    border: none;
	`,
	text: css`
		overflow: hidden;
		text-align: center;
		text-overflow: ellipsis;

		font-size: 12px;
		font-weight: 400;
		line-height: 16px;
	`,
	title: css`
		padding-left: 10px;
		color: ${token.magicColorUsages.text[2]};
		font-size: 14px;
		font-weight: 400;
		line-height: 20px;
	`,
	list: css`
		border-radius: 10px;
		overflow: hidden;
		cursor: pointer;
		background: ${token.magicColorScales.grey[0]};
	`,
	groupAdminTip: css`
		color: ${token.magicColorUsages.text[3]};
		font-size: 12px;
		font-weight: 400;
		line-height: 16px;
	`,
	buttonList: css`
		border-radius: 8px;
		width: 100%;
		background: ${token.magicColorScales.grey[0]};

		.${prefixCls}-btn {
			min-height: 50px;
			border-radius: 0;
			font-size: 14px;
			font-weight: 400;
			line-height: 20px;
		}

		.${prefixCls}-btn:not(:last-child) {
			border-bottom: 1px solid ${token.magicColorUsages.border};
		}
	`,
	viewAllMembersButton: css`
		margin-top: 8px;
		color: ${isDarkMode ? token.magicColorUsages.text[2] : token.magicColorUsages.text[1]};
	`,
}))
