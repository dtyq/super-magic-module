import CommonHeaderRight from "../../common/CommonHeaderRight"
import TextSplitV0 from "./v0/TextSplit"

export const TextSplitComponentVersionMap = {
	v0: {
		component: () => <TextSplitV0 />,
		headerRight: <CommonHeaderRight />,
	},
}
