import { createStyles } from "antd-style"

export const FILE_ITEM_HEIGHT = 46

export const FILE_ITEM_GAP = 8

export const useStyles = createStyles(({ css, token, prefixCls }) => {
	return {
		container: css`
			padding: 8px;
			border-radius: 10px;
			border: 1px solid ${token.colorBorder};
			background: ${token.colorBgContainer};
			width: 100%;
			min-width: 288px;
			overflow: hidden;
			user-select: none;
		`,
		fileList: css`
			overflow: hidden;
			transition: height 0.3s ease-in-out;
		`,
		fileItem: css`
			border: 1px solid ${token.colorBorder};
			border-radius: 4px;
			padding: 8px;
			height: ${FILE_ITEM_HEIGHT}px;

			color: ${token.colorText};
			font-size: ${token.fontSize};
			font-style: normal;
			font-weight: 400;
			line-height: 16px;
		`,
		more: css`
			font-size: ${token.fontSize}px;
			font-style: normal;
			font-weight: 400;
			line-height: 16px;
			text-align: center;
			padding-top: 8px;
			cursor: pointer;
			width: 100%;
			background-color: ${token.colorBgContainer};

			&:hover {
				color: ${token.colorPrimary};
			}
		`,
		fileName: css`
			width: 90%;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;

			overflow: hidden;
			color: ${token.colorText};
			font-size: 12px;
			font-weight: 400;
			line-height: 16px;
		`,
		controlButton: css`
      width: 30px;
      height: 30px;
      --${prefixCls}-button-padding-inline-sm: 6px !important;
      --${prefixCls}-button-padding-block-sm: 6px !important;
      background-color: ${token.magicColorUsages.fill[0]};

      &:hover,
      &:active,
      &:focus {
        background-color: ${token.magicColorUsages.fill[1]} !important;
      }

    `,
		fileSize: css`
			color: ${token.colorTextSecondary};
			font-size: 10px;
			font-weight: 400;
			line-height: 12px;
		`,
	}
})
