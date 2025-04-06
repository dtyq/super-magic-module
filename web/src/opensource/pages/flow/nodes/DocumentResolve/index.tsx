import DocumentResolveV0 from "./v0"
import DocumentResolveHeaderRightV0 from "./v0/DocumentResolveHeaderRight"

export const DocumentResolveComponentVersionMap = {
	v0: {
		component: () => <DocumentResolveV0 />,
		headerRight: <DocumentResolveHeaderRightV0 />,
	},
}
