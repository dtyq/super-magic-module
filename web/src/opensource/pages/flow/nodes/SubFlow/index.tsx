import SubFlowV0 from "./v0"
import SubFlowHeaderRightV0 from "./v0/components/SubFlowHeaderRight"

export const SubFlowComponentVersionMap = {
	v0: {
		component: () => <SubFlowV0 />,
		headerRight: <SubFlowHeaderRightV0 />,
	},
}
