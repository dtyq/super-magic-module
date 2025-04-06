import HTTPNodeV0 from "./v0"
import HTTPHeaderRightV0 from "./v0/components/HTTPHeaderRight"
import HTTPNodeV1 from "./v1"
import HTTPHeaderRightV1 from "./v1/components/HTTPHeaderRight"

export const HTTPComponentVersionMap = {
	v0: {
		component: () => <HTTPNodeV0 />,
		headerRight: <HTTPHeaderRightV0 />,
	},
	v1: {
		component: () => <HTTPNodeV1 />,
		headerRight: <HTTPHeaderRightV1 />,
	},
}
