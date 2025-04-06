import CommonHeaderRight from "../../common/CommonHeaderRight"
import GroupChatV0 from "./v0/GroupChat"

export const GroupChatComponentVersionMap = {
	v0: {
		component: () => <GroupChatV0 />,
		headerRight: <CommonHeaderRight />,
	},
}
