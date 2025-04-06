import CodeV0 from "./v0"
import CodeHeaderRightV0 from "./v0/components/CodeHeaderRight"

export const CodeComponentVersionMap = {
	v0: {
		component: () => <CodeV0 />,
		headerRight: <CodeHeaderRightV0 />,
	},
}
