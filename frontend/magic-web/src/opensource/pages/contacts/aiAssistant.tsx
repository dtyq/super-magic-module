import MagicInfiniteScrollList from "@/opensource/components/MagicInfiniteScrollList"
import type { MagicListItemData } from "@/opensource/components/MagicList/types"
import { useContactStore } from "@/opensource/stores/contact/hooks"
import { MessageReceiveType } from "@/types/chat"
import type { Friend } from "@/types/contact"
import { useMemoizedFn } from "ahooks"
import { createStyles } from "antd-style"
import { useCallback, useEffect } from "react"
import MagicScrollBar from "@/opensource/components/base/MagicScrollBar"
import { useChatWithMember } from "@/opensource/hooks/chat/useChatWithMember"
import userInfoStore from "@/opensource/stores/userInfo"
import userInfoService from "@/opensource/services/userInfo"
import AvatarStore from "@/opensource/stores/chatNew/avatar"

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

function AiAssistant() {
	const { styles } = useStyles()

	const { trigger, data } = useContactStore((s) => s.useFriends)()

	const { fetchUserInfos } = userInfoService
	const chatWith = useChatWithMember()

	useEffect(() => {
		if (data && data?.items?.length > 0) {
			const unUserInfos = data?.items?.filter((item) => !userInfoStore.get(item.friend_id))
			if (unUserInfos.length > 0)
				fetchUserInfos(unUserInfos.map((item) => item.friend_id), 2)
		}
	}, [data])

	const itemsTransform = useCallback(
		(item: Friend) => {
			const user = userInfoStore.get(item.friend_id)
			if (!user)
				return {
					id: item.friend_id,
					title: item.friend_id,
					avatar: AvatarStore.getTextAvatar(item.friend_id),
				}
			return {
				id: user.user_id,
				title: user.real_name,
				avatar: {
					src: user.avatar_url,
					children: user.real_name,
				},
				user,
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[],
	)

	const handleItemClick = useMemoizedFn((item: MagicListItemData) => {
		chatWith(item.id, MessageReceiveType.Ai, true)
	})

	return (
		<MagicScrollBar className={styles.empty}>
			<MagicInfiniteScrollList<Friend>
				data={data}
				trigger={trigger}
				itemsTransform={itemsTransform}
				onItemClick={handleItemClick}
			/>
		</MagicScrollBar>
	)
}

export default AiAssistant
