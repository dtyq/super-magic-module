import { createStyles } from "antd-style"
import bg from "@/assets/resources/ai-image-bg.png"

export const useStyles = createStyles(({ token, css, isDarkMode }) => ({
	container: css`
		padding: 20px;
		height: calc(100vh - 44px);
		width: calc(100vw - 240px - 100px);
		background-image: url(${bg});
		background-size: contain;
		background-repeat: no-repeat;
		position: relative;
		background-color: ${isDarkMode
			? token.magicColorUsages.bg[0]
			: token.magicColorScales.grey[0]};
	`,
	topMask: css`
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;

		background: ${isDarkMode
			? `linear-gradient(180deg, ${token.magicColorUsages.bg[0]} 0%, #2E2F3870 90%, ${token.magicColorUsages.bg[0]} 100%)`
			: "linear-gradient(180deg, rgba(249, 249, 249, 100%) 0%, rgba(255, 255, 255, 50%) 10%, rgba(255, 255, 255, 100%) 100%)"};
	`,
	bottomMask: css`
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 270px;
		background: ${isDarkMode
			? `linear-gradient(180deg,rgba(255, 255, 255, 0) 0%,rgba(28, 29, 35, 0.8), 60%, ${token.magicColorUsages.bg[0]} 88.86%)`
			: "linear-gradient(180deg,rgba(255, 255, 255, 0) 0%,rgba(255, 255, 255, 0.8) 24.68%,#fff 88.86%)"};
	`,
	header: css`
		display: flex;
		flex-direction: column;
		gap: 20px;
		position: relative;
	`,
	desc: css`
		font-size: 12px;
		color: ${isDarkMode ? token.magicColorUsages.text[2] : token.magicColorUsages.text[2]};
	`,
	button: css`
		height: 30px;
		padding: 5px 20px;
		background-color: ${token.colorBgContainer};
		border: 1px solid ${token.colorBorder};
		border-radius: 8px;
	`,
	magicButton: css`
		flex-shrink: 0;
		background: linear-gradient(
			95.14deg,
			#33d6c0 0%,
			#5083fb 25%,
			#336df4 50%,
			#4752e6 75%,
			#8d55ed 100%
		);
		border: none;
		color: ${token.magicColorUsages.white};

		&:hover {
			background: linear-gradient(117deg, #ff0ffa -53.65%, #315cec 163.03%) !important;
			color: ${token.magicColorUsages.white} !important;
		}
	`,
	waterfallWrapper: css`
		height: 100%;
		overflow-y: auto;
		scrollbar-width: none;
		margin-top: 20px;
		display: grid;
		// gap: 10px;
	`,
	waterfallItem: css`
		padding: 5px;
		border-radius: 8px;
		position: relative;
		grid-row-start: auto;
		grid-row-end: span 16;
		transform: translateZ(0);
	`,
	img: css`
		width: 100%;
		height: 100%;
		border-radius: 8px;
		background-color: rgb(199, 199, 199);
	`,
	mask: css`
		position: absolute;
		bottom: 5px;
		left: 5px;
		right: 5px;
		z-index: 99;
		// width: 100%;
		height: 50%;
		min-height: 100px;
		padding: 20px;
		transform: translateZ(0);
		border-radius: 0 0 8px 8px;
		background: linear-gradient(
			transparent 0%,
			rgba(0, 0, 0, 0.5) 50%,
			rgba(0, 0, 0, 0.7) 100%
		);
	`,
	hiddenScroll: css`
		overflow-x: hidden !important;
		-webkit-overflow-scrolling: touch;

		display: flex;
		flex-direction: column-reverse;
		height: 100%;
	`,
	prompt: css`
		overflow: hidden;
		text-overflow: ellipsis;
		-webkit-line-clamp: 3;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		color: ${token.magicColorUsages.white};
	`,
	editor: css`
		width: 90%;
		height: auto;
		min-height: 140px;
		max-height: 420px;
		position: absolute;
		bottom: 30px;
		left: 50%;
		margin-left: -45%;
		z-index: 99;
	`,
	mainInput: css`
		width: 100%;
		height: auto;
		min-height: 140px;
		max-height: 420px;
		border-radius: 20px;
		border: none;
		box-shadow: 0px 4px 14px 0px rgba(0, 0, 0, 0.1), 0px 0px 1px 0px rgba(0, 0, 0, 0.3);
	`,
}))
