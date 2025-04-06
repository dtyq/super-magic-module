import CommonHeaderRight from "../../common/CommonHeaderRight"
import ReplyV0 from "./v0"

export const ReplyComponentVersionMap = {
	v0: {
		component: () => <ReplyV0 />,
		headerRight: <CommonHeaderRight />,
	},
}
