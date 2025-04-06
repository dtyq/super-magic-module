import { createStyles } from "antd-style"

export const useStyles = createStyles(({ css, prefixCls, token }) => {
	return {
		button: css`
			background-color: ${token.magicColorUsages.fill[1]};

			&.${prefixCls}-popover-open {
				background-color: ${token.magicColorScales.brand[0]};
			}

			display: flex;
			align-items: center;
			justify-content: center;
			gap: 10px;
			line-height: 30px;
			width: 30px;
			height: 30px;
			border-radius: 8px;
			cursor: pointer;
			font-size: 12px;

			&:hover {
				background-color: ${token.magicColorUsages.fill[0]};
			}

			&:active {
				background-color: ${token.magicColorUsages.fill[2]};
			}
		`,
	}
})

export const usePopoverStyles = createStyles(({ css, prefixCls, token }) => {
	return {
		popover: css`
			.${prefixCls}-popover-inner {
				padding: 4px;
				border-radius: 12px;
				overflow: hidden;
			}
		`,
		menu: css`
			border: 0 !important;

			.${prefixCls}-menu-item,
				.${prefixCls}-menu-submenu:last-child
				.${prefixCls}-menu-submenu-title {
				&:last-child {
					margin-bottom: 0;
				}
			}

			.${prefixCls}-menu-item, .${prefixCls}-menu-submenu .${prefixCls}-menu-submenu-title {
				width: 100%;
				height: 36px;
				font-size: 14px;
				padding: ${token.paddingXS}px;
				display: flex;
				align-items: center;
				gap: 4px;
				margin: 0 0 4px 0;

				&:hover {
					background-color: ${token.magicColorScales.brand[0]} !important;
				}

				&:active {
					background-color: ${token.magicColorScales.brand[1]} !important;
				}
			}
		`,
	}
})
