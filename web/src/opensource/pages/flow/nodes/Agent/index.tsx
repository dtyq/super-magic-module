import CommonHeaderRight from "../../common/CommonHeaderRight"
import AgentV0 from "./v0"

export const AgentComponentVersionMap = {
	v0: {
		component: () => <AgentV0 />,
		headerRight: <CommonHeaderRight />,
	},
}
