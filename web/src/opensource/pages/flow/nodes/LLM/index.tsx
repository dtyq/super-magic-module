import LLMV0 from "./v0"
import LLMHeaderRightV0 from "./v0/components/LLMHeaderRight"
import LLMV1 from "./v1"
import LLMHeaderRightV1 from "./v1/components/LLMHeaderRight"

export const LLMComponentVersionMap = {
	v0: {
		component: () => <LLMV0 />,
		headerRight: <LLMHeaderRightV0 />,
	},
	v1: {
		component: () => <LLMV1 />,
		headerRight: <LLMHeaderRightV1 />,
	},
}
