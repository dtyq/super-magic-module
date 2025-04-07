import { createStyles } from "antd-style"
import { transparentize } from "polished"

export const useStyles = createStyles(({ token, css }) => ({
	dragEnteredTipWrapper: css`
		width: 100%;
		height: 100%;
		top: 0;
		left: 0;
		z-index: 10;
		transform: translateZ(0);
		will-change: transform;
	`,
	dragEnteredInnerWrapper: css`
		height: calc(100% - 40px);
		display: flex;
		justify-content: center;
		margin: 20px;
		align-items: center;
		font-size: 12px;
		color: ${token.magicColorUsages.text[1]};
		border: 2px dashed ${token.magicColorUsages.text[3]};
		backdrop-filter: blur(10px);
		background-color: ${transparentize(0.2, token.magicColorUsages.primaryLight.default)};
		border-radius: 8px;
		text-align: center;
	`,
	dragEnteredMainTip: css`
		font-size: 20px;
		font-weight: 600;
		line-height: 28px;
	`,
	dragEnteredTip: css`
		color: ${token.magicColorUsages.text[2]};
		text-align: center;
		font-size: 14px;
		font-weight: 400;
		line-height: 20px;
	`,
	dragEnteredLoader: css`
		@keyframes spin {
			to {
				transform: rotate(360deg);
			}
		}
		animation: spin 0.8s infinite linear;
	`,
}))
