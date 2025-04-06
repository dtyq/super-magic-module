import IntentionRecognitionV0 from "./v0"
import IntentionRecognitionHeaderRightV0 from "./v0/components/IntentionRecognitionHeaderRight"

export const IntentionRecognitionComponentVersionMap = {
	v0: {
		component: () => <IntentionRecognitionV0 />,
		headerRight: <IntentionRecognitionHeaderRightV0 />,
	},
}
