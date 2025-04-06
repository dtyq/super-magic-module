import CommonHeaderRight from "../../common/CommonHeaderRight"
import BranchV0 from "./v0"

export const BranchComponentVersionMap = {
	v0: {
		component: () => <BranchV0 />,
		headerRight: <CommonHeaderRight />,
	},
}
