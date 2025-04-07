import { createStyles } from "antd-style"

export const useStyles = createStyles(({ css, token }) => {
	return {
		layout: css`
			width: 100vw;
			height: 100vh;
			background: ${token.magicColorUsages.bg[0]};
			background-size: cover;
			background-position: center;
			background-repeat: no-repeat;
			position: relative;
		`,
		dragBar: css`
			width: 100%;
			height: ${token.titleBarHeight}px;
			position: absolute;
			left: 0;
			top: 0;
		`,
		wrapper: css`
			width: 100%;
			height: 100%;
			box-sizing: border-box;
			overflow-y: auto;
			overflow-x: hidden;
			text-align: center;
		`,
		main: css`
			padding: 40px 50px;
			height: 100%;
			flex: 1;
			overflow-y: auto;
			overflow-x: hidden;
			@media (max-width: 700px) {
				padding: 40px 10px;
			}
		`,
		contentWrapper: css`
			transform: translateY(-10%);
		`,
		container: css`
			width: 600px;
			height: fit-content;
			padding: 40px;

			border-radius: 12px;
			z-index: 1;
			background-color: ${token.magicColorUsages.bg[0]};
			border: 1px solid ${token.magicColorUsages.border};

			@media (max-width: 700px) {
				width: 100vw;
				min-width: 375px;
				border: none;
				overflow: hidden;
			}
			margin-top: 50px;
			margin-bottom: 20px;
		`,
	}
})
