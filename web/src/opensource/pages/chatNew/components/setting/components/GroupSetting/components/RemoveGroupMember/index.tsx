import type { DrawerProps } from "antd"
import { Checkbox, Drawer, Flex } from "antd"

import { useTranslation } from "react-i18next"
import { useState } from "react"
import { useMemoizedFn } from "ahooks"
import { IconChevronLeft } from "@tabler/icons-react"
import MagicIcon from "@/opensource/components/base/MagicIcon"
import MagicSpin from "@/opensource/components/base/MagicSpin"
import MagicAvatar from "@/opensource/components/base/MagicAvatar"
import AutoTooltipText from "@/opensource/components/other/AutoTooltipText"
import MagicButton from "@/opensource/components/base/MagicButton"
import useGroupInfo from "@/opensource/hooks/chat/useGroupInfo"
import useGroupConversationMembers from "@/opensource/hooks/chat/useGroupConversationMembers"
import { observer } from "mobx-react-lite"
import { useStyles } from "./style"
import userInfoStore from "@/opensource/stores/userInfo"
import { getUserJobTitle, getUserName } from "@/utils/modules/chat"
import { ChatApi } from "@/apis"
interface ChatSettingProps extends DrawerProps {
	onClose?: () => void
	groupId: string
}

const RemoveGroupMember = observer(
	({ open, groupId, onClose: onCloseInProps }: ChatSettingProps) => {
		const { styles } = useStyles()
		const { t } = useTranslation("interface")

		const onClose = useMemoizedFn(() => {
			onCloseInProps?.()
		})

		const { groupInfo } = useGroupInfo(groupId)
		console.log("groupInfo =======> ", groupInfo)

		const {
			data: members = [],
			isLoading: loadingMembers,
			mutate,
		} = useGroupConversationMembers(groupId)

		const [selectedMembers, setSelectedMembers] = useState<string[]>([])

		const onSelectMember = useMemoizedFn((userId: string) => {
			setSelectedMembers((prev) => {
				if (prev.includes(userId)) {
					return prev.filter((id) => id !== userId)
				}
				return [...prev, userId]
			})
		})

		const onRemoveMembers = useMemoizedFn((userIds: string[]) => {
			if (!userIds.length) return
			ChatApi.kickGroupUsers({
				group_id: groupId,
				user_ids: userIds,
			}).then(() => {
				setSelectedMembers([])
				return mutate((prev) => prev?.filter((item) => !userIds.includes(item.user_id)))
			})
		})

		if (!groupId) return null

		if (loadingMembers) {
			return <MagicSpin spinning={loadingMembers} />
		}

		return (
			<Drawer
				open={open}
				closable
				onClose={onClose}
				title={
					<Flex align="center" gap={4}>
						<MagicIcon component={IconChevronLeft} size={24} onClick={onClose} />
						{t("chat.groupSetting.removeMember")}
					</Flex>
				}
				width={380}
				push={false}
				classNames={{
					header: styles.header,
					mask: styles.mask,
					body: styles.body,
				}}
			>
				<Flex vertical className={styles.memberList} flex={1}>
					{members.map((user) => {
						const userInfo = userInfoStore.get(user.user_id)

						return (
							<Flex
								key={user.user_id}
								align="center"
								justify="space-between"
								gap={8}
								className={styles.memberItem}
							>
								<Checkbox
									disabled={userInfo?.user_id === groupInfo?.group_owner}
									checked={selectedMembers.includes(user.user_id)}
									onChange={() => onSelectMember(user.user_id)}
								/>
								<MagicAvatar size={28} src={userInfo?.avatar_url}>
									{getUserName(userInfo)}
								</MagicAvatar>
								<Flex vertical flex={1}>
									<AutoTooltipText>{getUserName(userInfo)}</AutoTooltipText>
									<AutoTooltipText className={styles.jobTitle}>
										{getUserJobTitle(userInfo)}
									</AutoTooltipText>
								</Flex>
								{userInfo?.user_id !== groupInfo?.group_owner && (
									<MagicButton
										type="default"
										danger
										className={styles.removeButton}
										onClick={() => onRemoveMembers([user.user_id])}
									>
										{t("chat.groupSetting.remove")}
									</MagicButton>
								)}
							</Flex>
						)
					})}
				</Flex>
				{selectedMembers.length > 0 && (
					<MagicButton
						className={styles.removeCheckedButton}
						size="large"
						block
						type="primary"
						onClick={() => onRemoveMembers(selectedMembers)}
					>
						{t("chat.groupSetting.remove")} ({selectedMembers.length})
					</MagicButton>
				)}
			</Drawer>
		)
	},
)

export default RemoveGroupMember
