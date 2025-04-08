import { createStyles } from "antd-style"

export const useStyles = createStyles(({ css, isDarkMode, prefixCls, token }) => {
	return {
		popover: css`
			border-radius: 12px;

		
			.${prefixCls}-popover-inner {
				padding: 0;
				width: fit-content;
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
			width: fit-content;
        	min-width: unset;
			user-select: none;

			--${prefixCls}-menu-sub-menu-item-selected-color: ${token.magicColorUsages.text[1]} !important;

				.${prefixCls}-dropdown-menu-item.${prefixCls}-dropdown-menu-item {
					margin: 2px 0;
					--${prefixCls}-control-padding-horizontal: 8px;
          --${prefixCls}-dropdown-padding-block: 7px;
					min-width: 76px;
					box-sizing: content-box;
					border-radius: 10px;
				}
				.${prefixCls}-dropdown-menu-item.${prefixCls}-dropdown-menu-item:hover {
					background-color: ${
						isDarkMode
							? token.magicColorUsages.primaryLight.hover
							: token.magicColorUsages.primaryLight.default
					};
				}
				.${prefixCls}-dropdown-menu-item-divider.${prefixCls}-dropdown-menu-item-divider {
					background-color: ${
						isDarkMode
							? token.magicColorUsages.border
							: token.magicColorUsages.primaryLight.default
					};
				}
				.${prefixCls}-dropdown-menu-item-danger.${prefixCls}-dropdown-menu-item-danger:not(.${prefixCls}-dropdown-menu-item-disabled):hover {
					background-color: ${
						isDarkMode
							? token.magicColorUsages.danger.default
							: token.magicColorScales.red[0]
					} !important;
					color: ${isDarkMode ? "white" : token.magicColorUsages.danger.default} !important;
				}

		`,
		arrow: css`
			width: 20px !important;
			color: ${isDarkMode ? token.magicColorScales.grey[5] : token.magicColorUsages.text[2]};
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
