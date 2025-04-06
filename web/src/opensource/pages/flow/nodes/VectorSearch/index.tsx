import VectorSearchV0 from "./v0"
import VectorSearchHeaderRightV0 from "./v0/components/VectorSearchHeaderRight"
import VectorSearchV1 from "./v1"
import VectorSearchHeaderRightV1 from "./v1/components/VectorSearchHeaderRight"

export const VectorSearchComponentVersionMap = {
	v0: {
		component: () => <VectorSearchV0 />,
		headerRight: <VectorSearchHeaderRightV0 />,
	},
	v1: {
		component: () => <VectorSearchV1 />,
		headerRight: <VectorSearchHeaderRightV1 />,
	},
}
