import CommonHeaderRight from "../../common/CommonHeaderRight"
import StartV0 from "./v0"
import StartV1 from "./v1"
// import StartV1 from "./v1"

export const StartComponentVersionMap = {
	v0: {
		component: () => <StartV0 />,
		headerRight: <CommonHeaderRight />,
	},
	v1: {
		component: () => <StartV1 />,
		headerRight: <CommonHeaderRight />,
	},
}
