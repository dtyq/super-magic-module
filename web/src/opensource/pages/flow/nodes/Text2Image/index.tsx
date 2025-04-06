import Text2ImageHeaderRightV0 from "./v0/components/Text2ImageHeaderRight"
import Text2ImageV0 from "./v0/Text2Image"
import Text2ImageHeaderRightV1 from "./v1/components/Text2ImageHeaderRight"
import Text2ImageV1 from "./v1/Text2Image"

export const Text2ImageComponentVersionMap = {
	v0: {
		component: () => <Text2ImageV0 />,
		headerRight: <Text2ImageHeaderRightV0 />,
	},
	v1: {
		component: () => <Text2ImageV1 />,
		headerRight: <Text2ImageHeaderRightV1 />,
	},
}
