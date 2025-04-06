import LLMCallV0 from "./v0"
import LLMCallHeaderRightV0 from "./v0/components/LLMHeaderRight"

export const LLMCallComponentVersionMap = {
	v0: {
		component: () => <LLMCallV0 />,
		headerRight: <LLMCallHeaderRightV0 />,
	},
}
