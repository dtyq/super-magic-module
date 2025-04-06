import type { Theme } from "antd-style"
import { css } from "antd-style"

export default ({ prefixCls }: { prefixCls: string; token: Theme }) => css`
	.${prefixCls}-menu-item {
		display: flex !important;
		align-items: center;
		padding-left: 8px !important;
		padding-right: 8px !important;
	}

	.${prefixCls}-menu-title-content {
		margin-inline-start: 4px !important;
	}

	.${prefixCls}-message-custom-content {
		display: flex !important;
		align-items: center;
		justify-content: center;
		gap: 10px;
	}
  
	th.${prefixCls}-table-cell {
		--${prefixCls}-table-cell-padding-block: 10px !important;
	}

  .${prefixCls}-menu-title-content {
    flex: 1;
  }

  .${prefixCls}-dropdown-menu-submenu-title{
    display: flex;
    align-items: center;
  }

`
