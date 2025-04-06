import VectorDeleteV0 from "./v0"
import VectorDeleteHeaderRightV0 from "./v0/components/VectorDeleteHeaderRight"

export const VectorDeleteComponentVersionMap = {
	v0: {
		component: () => <VectorDeleteV0 />,
		headerRight: <VectorDeleteHeaderRightV0 />,
	},
}
