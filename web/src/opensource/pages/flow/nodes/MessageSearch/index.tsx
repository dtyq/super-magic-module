import CommonHeaderRight from "../../common/CommonHeaderRight"
import MessageSearchV0 from "./v0"

export const MessageSearchComponentVersionMap = {
	v0: {
		component: () => <MessageSearchV0 />,
		headerRight: <CommonHeaderRight />,
	},
}
