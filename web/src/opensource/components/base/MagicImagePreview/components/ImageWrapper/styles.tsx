import { createStyles } from "antd-style"

export const useStyles = createStyles(({ css, prefixCls }) => ({
	wrapper: css`
		border-radius: 10px;

		position: relative;
		overflow: hidden;
		display: inline-block;
	`,
	button: css`
		cursor: pointer;
		border: none;
		padding: 0;
		width: 100%;
		height: 100%;
		& svg {
			width: 100%;
		}
	`,
	image: css`
		width: 100%;
		height: 100%;
		object-fit: cover;
		max-width: 240px;
		max-height: 240px;
	`,
	networkError: css`
		padding-bottom: 0 !important;
	`,
	longImage: css`
		width: 180px;
		height: 320px;
		object-fit: cover;
		max-height: unset !important;
	`,
	longImageTip: css`
		position: absolute;
		top: 10px;
		right: 10px;
		background: rgba(0, 0, 0, 0.5);
		color: #fff;
		font-size: 12px;
		font-weight: 400;
		line-height: 16px;
		display: flex;
		height: 20px;
		padding: 2px 8px;
		flex-direction: column;
		align-items: flex-start;
		border-radius: 3px;
	`,
	skeletonImage: css`
		width: 100% !important;
		height: 100%;
		.${prefixCls}-skeleton-image {
			width: 100% !important;
			height: 100% !important;
			min-width: 96px !important;
			min-height: 96px !important;
		}
	`,
}))
