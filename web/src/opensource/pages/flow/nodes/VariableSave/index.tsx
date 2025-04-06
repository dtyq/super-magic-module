import CommonHeaderRight from "../../common/CommonHeaderRight"
import VariableSaveV0 from "./v0"

export const VariableSaveComponentVersionMap = {
	v0: {
		component: () => <VariableSaveV0 />,
		headerRight: <CommonHeaderRight />,
	},
}
