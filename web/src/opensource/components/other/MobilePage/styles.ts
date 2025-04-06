import { createStyles, keyframes } from "antd-style"

export const useStyles = createStyles(({ css }) => {
	const fadeInAnimation = keyframes`
		from {
			transform: translateX(-50%) rotate(0deg)
		}
		to {
			transform: translateX(-50%) rotate(360deg)
		}
	`
	const fadeOutAnimation = keyframes`
		from {
			transform: translateX(-50%) rotate(360deg)
		}
		to {
			transform: translateX(-50%) rotate(0deg)
		}
	`
	const bgMove = keyframes`
		from {
			transform: rotateX(45deg) translateY(-50%);
		}
		to {
			transform: rotateX(45deg) translateY(0);
		}
	`
	return {
		layout: css`
			width: 100vw;
			height: 100vh;
			align-items: center;
			overflow: hidden;
			position: relative;
		`,
		mask: css`
			width: 100vw;
			height: 100vh;
			position: absolute;
			left: 0;
			top: 0;
			z-index: 2;
			background-image: linear-gradient(to bottom, rgba(23, 24, 28, 0.6) 20%, #211a27 60%);
		`,
		grid: css`
			width: 100vw;
			height: 100vh;
			overflow: hidden;
			perspective: 700px;
			position: relative;
			z-index: 1;
			background-image: linear-gradient(to bottom, rgba(23, 24, 28, 1), #211a27);
		`,
		gridFade: css`
			width: 100%;
			height: 100%;
			position: absolute;
			z-index: 1;
			background: radial-gradient(ellipse at 50% 50%, #00000000 20%, #000 100%);
		`,
		gridLines: css`
			width: 100%;
			height: 200%;
			background-image: linear-gradient(to right, #ffffff20 1px, transparent 0),
				linear-gradient(to bottom, #ffffff20 1px, transparent 0);
			background-size: 45px 45px;
			background-repeat: repeat;
			transform-origin: 100% 0 0;
			animation: ${bgMove} 15s linear infinite;
		`,
		animation: css`
			width: 100vw;
			height: 100vw;
			opacity: 0.8;
			position: absolute;
			left: 0;
			top: -116vw;
			z-index: 5;
		`,
		step: css`
			animation-timing-function: linear;
			animation-iteration-count: infinite;
			width: 100vw;
			height: 100vw;
			left: 50% !important;
			position: absolute;
			will-change: transform;

			& img {
				width: 100%;
				height: 100%;
				border-radius: inherit;
				object-position: center;
				object-fit: fill;
			}
		`,
		stepA: css`
			-webkit-filter: blur(122.50128173828125px);
			aspect-ratio: 1 / 1;
			border-radius: 100%;
			filter: blur(122.50128173828125px);
			flex: none;
			height: auto;
			left: 50%;
			top: 0;
			width: 933px;
			opacity: 0.5;
			animation-name: ${fadeInAnimation};
			animation-duration: 2s;
		`,
		stepB: css`
			-webkit-filter: blur(105.0010986328125px);
			aspect-ratio: 0.9801193089294542 / 1;
			border-radius: 100%;
			filter: blur(105.0010986328125px);
			flex: none;
			height: auto;
			left: 50%;
			opacity: 0.4;
			top: 110px;
			width: 700px;
			animation-name: ${fadeOutAnimation};
			animation-duration: 2s;
		`,
		stepC: css`
			-webkit-filter: blur(87.50091552734375px);
			aspect-ratio: 1 / 1;
			border-radius: 100%;
			filter: blur(87.50091552734375px);
			flex: none;
			height: auto;
			left: 50%;
			opacity: 0.6;
			top: 175px;
			width: 583px;
			animation-name: ${fadeOutAnimation};
			animation-duration: 2s;
		`,
		stepD: css`
			-webkit-filter: blur(61.250640869140625px);
			aspect-ratio: 1 / 1;
			border-radius: 100%;
			filter: blur(61.250640869140625px);
			flex: none;
			height: auto;
			left: 50%;
			opacity: 0.8;
			top: 233px;
			width: 467px;
			animation-name: ${fadeInAnimation};
			animation-duration: 2s;
		`,
		wrapper: css`
			width: calc(100vw - 40px);
			height: calc(100vh - 40px);
			position: absolute;
			left: 20px;
			top: 20px;
			z-index: 10;
			display: flex;
			flex-direction: column;
		`,
		header: css`
			margin-top: 50px;
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 10px;
			width: 100%;
			height: auto;
		`,
		desc: css`
			color: #f9f9f9;
			text-align: center;
			font-size: 24px;
			font-style: normal;
			font-weight: 600;
			line-height: 32px;
			margin: 10px 0 4px 0;
		`,
		tip: css`
			color: rgba(249, 249, 249, 0.6);
			text-align: center;
			font-size: 14px;
			font-style: normal;
			font-weight: 400;
			line-height: 20px;
		`,
		footer: css`
			width: 100%;
			margin-top: auto;
			color: rgba(249, 249, 249, 0.6);
			text-align: center;
			font-size: 12px;
			font-style: normal;
			font-weight: 400;
			line-height: 16px;
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
		`,
		watermark: css`
			position: absolute;
			left: 19px;
			bottom: -64px;
		`,
		menu: css`
			width: 100%;
			margin-top: 100px;
			padding: 0 20px;
			gap: 8px;
			display: flex;
			flex-direction: column;
		`,
		item: css`
			display: flex;
			height: 60px;
			padding: 10px 20px;
			align-items: center;
			gap: 6px;
			align-self: stretch;
			border-radius: 8px;
			border: 1px solid rgba(255, 255, 255, 0.08);
			background: #16161a;
			color: #f9f9f9;
		`,
		itemDisabled: css`
			color: rgba(249, 249, 249, 0.6);
		`,
		button: css`
			color: #587df0;
			font-size: 14px;
			font-style: normal;
			font-weight: 400;
			line-height: 20px;
			margin-left: auto;
		`,
		buttonDisabled: css`
			color: rgba(249, 249, 249, 0.6);
		`,
	}
})
