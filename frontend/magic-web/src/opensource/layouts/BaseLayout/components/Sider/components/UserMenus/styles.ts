import { createStyles } from "antd-style"

export const useStyles = createStyles(({ css, isDarkMode, prefixCls, token }) => {
	return {
		popover: css`
			.${prefixCls}-popover-inner {
				padding: 0;
				width: fit-content;
				min-width: 200px;
				border-radius: 12px;
				--${prefixCls}-color-bg-elevated: ${token.magicColorScales.grey[0]} !important;
			}

			.${prefixCls}-popover-inner-content {
				display: flex;
				flex-direction: column;
				gap: 4px;
			}

			.${prefixCls}-btn {
				width: 100%;
				font-size: 14px;
				padding-left: 8px;
			}

			.${prefixCls}-menu-submenu-title, .magic-menu-item {
				--${prefixCls}-menu-item-height: 34px !important;
			}
		`,
		menu: css`
			--${prefixCls}-menu-popup-bg: ${token.magicColorScales.grey[0]} !important;
			.${prefixCls}-menu-item-selected {
				--${prefixCls}-menu-item-selected-bg: var(--${prefixCls}-color-info-bg) !important;
				--${prefixCls}-menu-item-selected-color: var(--${prefixCls}-blue) !important;
			}
		`,
		arrow: css`
			width: 20px !important;
			margin-right: -10px;
			color: ${isDarkMode ? token.magicColorScales.grey[5] : token.magicColorUsages.text[3]};
		`,
		item: css`
			width: 100%;
			height: 34px;
			display: flex;
			align-items: center;
			gap: 6px;
			font-size: 14px;
		`,
		icon: css`
			width: 24px;
			height: 24px;

			& > img {
				width: 100%;
				height: 100%;
				vertical-align: top;
			}
		`,
		menuItem: css`
			display: flex;
			align-items: center;
		`,
		menuItemLeft: css`
			flex: 1;
			overflow: hidden;
		`,
		menuItemTop: css`
			display: flex;
			align-items: center;
			font-size: 14px;
			height: 20px;
		`,
		menuItemTopName: css`
			flex: 1 0 0;
			overflow: hidden;
			font-weight: 600;
			white-space: nowrap;
			text-overflow: ellipsis;
		`,
		menuItemBottom: css`
			flex: 1 0 0;
			display: flex;
			align-items: center;
			color: ${isDarkMode ? token.magicColorScales.grey[7] : token.magicColorScales.grey[5]};
			font-size: 12px;
			height: 16px;
		`,
	}
})
