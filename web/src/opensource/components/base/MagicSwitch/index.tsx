import { createStyles } from "antd-style"
import { Switch, type SwitchProps } from "antd"

const useStyles = createStyles(({ prefixCls,token, css }) => {
	return {
    magicSwitch: css`
      width: 40px;
      height: 24px;
      background-color: ${token.magicColorUsages.fill[0]};
      .${prefixCls}-switch-handle {
        top: 3px;
        left: 3px;
        &::before {
          width: 18px;
          height: 18px;

          box-shadow:
            0px 0px 1px 0px rgba(0, 0, 0, 0.3),
            0px 4px 6px 0px rgba(0, 0, 0, 0.1);
          border: 1px solid ${token.magicColorUsages.border};
        }
      }
      &:hover {
        background-color: ${token.magicColorScales.grey[1]} !important;
      }  
      &.${prefixCls}-switch-loading {
        .${prefixCls}-switch-handle {
          &::before {
            background-color: transparent;
            border: none;
            box-shadow: none;
          }
          .${prefixCls}-switch-loading-icon {
            color: #fff;
          }
        }
      }
      &[disabled] {
        .${prefixCls}-switch-inner {
          background-color: #D3DFFB;
        }
      }
      &[aria-checked="true"] {
        .${prefixCls}-switch-inner {
          background: #315CEC;
        }
        &:hover {
          .${prefixCls}-switch-inner {
            background-color: #2447C8;
          }
        }
      }
    `,
	}
})

export const MagicSwitch = ({ className, ...props }: SwitchProps) => {
	const { styles, cx } = useStyles()
	return <Switch className={cx(styles.magicSwitch, className)} {...props} />
}
