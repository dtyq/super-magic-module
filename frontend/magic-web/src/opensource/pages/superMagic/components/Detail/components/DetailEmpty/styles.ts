import { createStyles } from "antd-style"
import background from "../../../../assets/image/background.png"

// Define the styles using createStyles
export const useStyles = createStyles(() => {
	return {
		detailEmptyContainer: {
			display: "flex",
			flexDirection: "column",
			alignItems: "center",
			justifyContent: "center",
			height: "100%",
			width: "100%",
			backgroundImage: `url(${background})`,
			backgroundRepeat: "no-repeat",
			backgroundPosition: "center top",
		},
		icon: {
			width: 120,
			height: 120,
		},
		title: {
			fontSize: 20,
			fontWeight: 600,
			background: "linear-gradient(128deg, #3F8FFF 5.59%, #EF2FDF 95.08%)",
			backgroundClip: "text",
			WebkitBackgroundClip: "text",
			WebkitTextFillColor: "transparent",
			marginTop: 14.49,
		},
		text: {
			fontSize: 14,
			fontWeight: 400,
			background: "linear-gradient(128deg, #3F8FFF 5.59%, #EF2FDF 95.08%)",
			backgroundClip: "text",
			WebkitBackgroundClip: "text",
			WebkitTextFillColor: "transparent",
			marginTop: 4,
		},
	}
})
