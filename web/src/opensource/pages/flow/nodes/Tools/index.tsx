import ToolsV0 from "./v0"
import ToolsHeaderRightV0 from "./v0/components/ToolsHeaderRight"

export const ToolsComponentVersionMap = {
	v0: {
		component: () => <ToolsV0 />,
		headerRight: <ToolsHeaderRightV0 />,
	},
}
