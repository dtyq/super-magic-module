import MagicInfiniteScrollList from "@/opensource/components/MagicInfiniteScrollList"
import { useContactStore } from "@/opensource/stores/contact/hooks"
import type { GroupConversationDetail } from "@/types/chat/conversation"
import { useMemoizedFn } from "ahooks"
import { createStyles } from "antd-style"
import { useCallback } from "react"
import MagicScrollBar from "@/opensource/components/base/MagicScrollBar"
import { useChatWithMember } from "@/opensource/hooks/chat/useChatWithMember"
import { MessageReceiveType } from "@/types/chat"

const useStyles = createStyles(({ css, token }) => {
	return {
		empty: css`
			padding: 20px;
			width: 100%;
			height: calc(100vh - ${token.titleBarHeight}px);
			overflow-y: auto;
		`,
	}
})

function MyGroups() {
	const { styles } = useStyles()
	const { trigger, data } = useContactStore((s) => s.useUserGroups)()

	const chatWith = useChatWithMember()
	const itemsTransform = useCallback(
		(item: GroupConversationDetail & { conversation_id: string }) => ({
			id: item.id,
			title: item.group_name,
			avatar: {
				src: item.group_avatar,
				children: item.group_name,
			},
			group: item,
		}),
		[],
	)

	const handleItemClick = useMemoizedFn(({ group }: ReturnType<typeof itemsTransform>) => {
		chatWith(group.id, MessageReceiveType.Group, true)
	})

	return (
		<MagicScrollBar className={styles.empty}>
			<MagicInfiniteScrollList<
				GroupConversationDetail & { conversation_id: string },
				ReturnType<typeof itemsTransform>
			>
				data={data}
				trigger={trigger}
				itemsTransform={itemsTransform}
				onItemClick={handleItemClick}
			/>
		</MagicScrollBar>
	)
}

export default MyGroups
