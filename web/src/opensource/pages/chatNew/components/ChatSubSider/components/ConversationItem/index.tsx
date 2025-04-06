import { MessageReceiveType } from "@/types/chat"
import conversationStore from "@/opensource/stores/chatNew/conversation"
import { observer } from "mobx-react-lite"
import { Skeleton } from "antd"
import type Conversation from "@/opensource/models/chat/conversation"
import GroupConversationItem from "../GroupConversationItem"
import UserConversationItem from "../UserConversationItem"

interface ConversationItemProps {
	conversationId: string
	onClick: (conversation: Conversation) => void
}

const SkeletonItem = (
	<Skeleton
		style={{ padding: 4, width: "100%" }}
		avatar
		active
		title={{ style: { marginBlockStart: 0 } }}
		paragraph={{ rows: 1, width: "100%", style: { marginBlockStart: 4 } }}
	/>
)

const ConversationItem = observer((props: ConversationItemProps) => {
	const { conversationId, onClick } = props
	const conversation = conversationStore.conversations?.[conversationId]

	switch (conversation?.receive_type) {
		case MessageReceiveType.Group:
			return <GroupConversationItem conversationId={conversationId} onClick={onClick} />
		case MessageReceiveType.User:
		case MessageReceiveType.Ai:
			return <UserConversationItem conversationId={conversationId} onClick={onClick} />
		default:
			return SkeletonItem
	}
})

export default ConversationItem
