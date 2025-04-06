import LoaderV0 from "./v0"
import LLMCallHeaderRightV0 from "./v0/components/LoaderHeaderRight"
import LoaderV1 from "./v1"
import LLMCallHeaderRightV1 from "./v1/components/LLMCallHeaderRight"

export const LoaderComponentVersionMap = {
	v0: {
		component: () => <LoaderV0 />,
		headerRight: <LLMCallHeaderRightV0 />,
	},
	v1: {
		component: () => <LoaderV1 />,
		headerRight: <LLMCallHeaderRightV1 />,
	},
}
