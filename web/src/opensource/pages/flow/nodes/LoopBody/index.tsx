import CommonHeaderRight from "../../common/CommonHeaderRight"
import LoopBodyV0 from "./v0"

export const LoopBodyComponentVersionMap = {
	v0: {
		component: () => <LoopBodyV0 />,
		headerRight: <CommonHeaderRight />,
	},
}
