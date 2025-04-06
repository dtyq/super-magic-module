import CommonHeaderRight from "../../common/CommonHeaderRight"
import LoopV0 from "./v0"

export const LoopComponentVersionMap = {
	v0: {
		component: () => <LoopV0 />,
		headerRight: <CommonHeaderRight />,
	},
}
