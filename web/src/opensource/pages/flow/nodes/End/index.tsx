import CommonHeaderRight from "../../common/CommonHeaderRight"
import EndV0 from "./v0"

export const EndComponentVersionMap = {
	v0: {
		component: () => <EndV0 />,
		headerRight: <CommonHeaderRight />,
	},
}
