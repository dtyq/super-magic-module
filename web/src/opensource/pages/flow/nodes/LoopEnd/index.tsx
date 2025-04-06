import CommonHeaderRight from "../../common/CommonHeaderRight"
import LoopEndV0 from "./v0"

export const LoopEndComponentVersionMap = {
	v0: {
		component: () => <LoopEndV0 />,
		headerRight: <CommonHeaderRight />,
	},
}
