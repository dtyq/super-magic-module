import { createStyles } from "antd-style"
import background from "../../assets/image/background.png"

const useStyles = createStyles(({ token }) => ({
	emptyWorkspacePanelContainer: {
		width: "100%",
		height: "100%",
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "flex-start",
		backgroundImage: `url(${background})`,
		backgroundRepeat: "no-repeat",
		backgroundPosition: "center top",
		overflow: "auto",
		paddingTop: "40px",
		paddingBottom: "40px",
		"@media (max-width: 768px)": {
			justifyContent: "center",
		},
	},
	magicBetaImage: {
		width: "120px",
	},
	emptyWorkspacePanelTitle: {
		marginTop: "17.06px",
		fontWeight: "400",
	},
	emptyWorkspacePanelSubTitle: {
		fontWeight: "600",
		marginTop: "4px",
		fontSize: "20px",
	},
	emptyWorkspacePanelCaseTitle: {
		background: "linear-gradient(128deg, #3F8FFF 5.59%, #EF2FDF 95.08%)",
		backgroundClip: "text",
		WebkitBackgroundClip: "text",
		WebkitTextFillColor: "transparent",
		fontWeight: "600",
		fontSize: "18px",
		marginTop: "40px",
	},
	arrowBottomImage: {
		marginTop: "10px",
	},
	emptyWorkspacePanelCaseTypeList: {
		display: "flex",
		gap: 10,
		marginTop: 30,
	},
	emptyWorkspacePanelCaseTypeItem: {
		borderRadius: 1000,
		border: `1px solid ${token.magicColorUsages.border}`,
		backgroundColor: "white",
		padding: "4px 12px",
		fontSize: 14,
		fontWeight: 400,
		color: token.magicColorUsages.text[1],
		cursor: "pointer",
		"&:hover": {
			color: token.magicColorUsages.text[0],
			borderColor: token.magicColorUsages.border,
		},
	},
	emptyWorkspacePanelCaseTypeItemActive: {
		borderColor: `${token.colorPrimary} !important`,
		color: `${token.colorPrimary} !important`,
	},
	emptyWorkspacePanelCase: {
		marginTop: "10px",
		width: "100%",
	},
	emptyWorkspacePanelCaseItem: {
		width: "100%",
		height: "100%",
		borderRadius: "8px",
		boxShadow: "0px 4px 14px 0px rgba(0, 0, 0, 0.1), 0px 0px 1px 0px rgba(0, 0, 0, 0.3)",
		padding: "14px",
		position: "relative",
		overflow: "hidden",
		transition: "top 0.15s linear, transform 0.15s linear",
		top: "0px",
		cursor: "pointer",
		backgroundColor: "white",
		"&:hover": {
			outline: `1px solid ${token.colorPrimary}`,
			top: "-10px",
		},
		"&:active": {
			transform: "scale(0.98)",
		},
	},
	emptyWorkspacePanelCaseItemTitle: {
		fontWeight: "600",
		fontSize: "14px",
	},
	emptyWorkspacePanelCaseItemSubTitle: {
		fontSize: "12px",
		fontWeight: "400",
		marginTop: "10px",
		color: token.magicColorUsages.text[3],
	},
	emptyWorkspacePanelCaseItemImage: {
		width: "181.809px",
		height: "116.141px",
		transform: "rotate(-15deg)",
		aspectRatio: "181.81/116.14",
		position: "absolute",
		right: "-2.673px",
		bottom: "-63.239px",
		borderRadius: "2px",
		boxShadow: "0px 4px 14px 0px rgba(0, 0, 0, 0.10), 0px 0px 1px 0px rgba(0, 0, 0, 0.30)",
		overflow: "hidden",
	},
	messagePanelWrapper: {
		width: "100%",
		padding: "0 30px",
		marginTop: "30px",
		display: "flex",
		justifyContent: "center",
	},
	messagePanel: {
		width: "100%",
		maxWidth: "800px",
		padding: "0",
	},
	messagePanelTextAreaWrapper: {
		height: "80px",
	},
	swiper: {
		width: "100%",
		paddingTop: "20px !important",
		paddingBottom: "30px !important",
		[`& .swiper-scrollbar`]: {
			backgroundColor: token.magicColorUsages.fill[2],
			height: "5px !important",
			width: "200px !important",
			left: "50% !important",
			transform: "translateX(-50%) !important",
		},
		[`& .swiper-scrollbar-drag`]: {
			background: "linear-gradient(135deg, #FFAFC8 0%, #E08AFF 50%, #9FC3FF 100%)",
			cursor: "pointer",
			"&:hover, &:active": {
				height: "6px",
				top: "-0.5px",
				position: "relative",
			},
		},
		[`& .swiper-wrapper`]: {
			display: "flex",
			justifyContent: "center",
		},
	},
	swiperSlide: {
		width: "200px !important",
		height: "200px !important",
	},
}))

export default useStyles
