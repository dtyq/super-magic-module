import background from "@/opensource/pages/superMagicMobile/assets/image/background.png"
import { createStyles } from "antd-style"

export const useStyles = createStyles(() => {
	return {
		container: {
			flex: "auto",
			display: "flex",
			flexDirection: "column",
			alignItems: "center",
			justifyContent: "space-between",
			padding: 10,
			height: "100%",
			backgroundImage: `url(${background})`,
			backgroundRepeat: "no-repeat",
			backgroundPosition: "center top",
			backgroundAttachment: "fixed",
			backgroundSize: "1072px 666.5px",
		},
		containerTop: {
			display: "flex",
			flexDirection: "column",
			alignItems: "center",
			justifyContent: "space-around",
			flex: "auto",
			overflow: "hidden",
		},
		hello: {
			display: "flex",
			flexDirection: "column",
			alignItems: "center",
			justifyContent: "space-around",
			gap: 5,
			// justifyContent: "center",
			// paddingTop: 30,
		},
		caseWrapper: {
			display: "flex",
			flexDirection: "column",
			alignItems: "center",
			justifyContent: "space-around",
			// justifyContent: "center",
			// marginBottom: 30,
		},
		image: {
			// width: 120,
		},
		title: {
			fontSize: 14,
		},
		subTitle: {
			// marginTop: 4,
			fontSize: 20,
			fontWeight: 600,
		},
		arrowDown: {
			width: 12,
		},
		caseTitle: {
			// marginTop: 50,
		},
		case: {
			//
		},
		messagePanel: {
			marginTop: 15,
		},
	}
})
