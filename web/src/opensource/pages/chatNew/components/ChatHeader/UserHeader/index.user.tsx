import { Flex } from "antd"
import MagicButton from "@/opensource/components/base/MagicButton"
import type { HTMLAttributes } from "react"
import { useMemo } from "react"
import { useContactStore } from "@/opensource/stores/contact/hooks"
import type Conversation from "@/opensource/models/chat/conversation"
import { getUserDepartmentFirstPath, getUserJobTitle, getUserName } from "@/utils/modules/chat"
import { cx } from "antd-style"
import conversationStore from "@/opensource/stores/chatNew/conversation"
import MagicMemberAvatar from "@/opensource/components/business/MagicMemberAvatar"
import MagicIcon from "@/opensource/components/base/MagicIcon"
import useUserInfo from "@/opensource/hooks/chat/useUserInfo"
import { observer } from "mobx-react-lite"
import { useTranslation } from "react-i18next"
import { useMemoizedFn } from "ahooks"
import { IconDots } from "@tabler/icons-react"
import { ExtraSectionKey } from "@/opensource/pages/chatNew/types"
import useStyles from "../styles"
import CurrentTopic from "../CurrentTopic"

interface HeaderProps extends HTMLAttributes<HTMLDivElement> {
	conversation: Conversation
}

function HeaderRaw({ conversation, className }: HeaderProps) {
	const { styles } = useStyles()
	const { t } = useTranslation("interface")

	// const imStyle = useAppearanceStore((state) => state.imStyle)
	const { userInfo: conversationUser } = useUserInfo(conversation.receive_id)

	const { settingOpen } = conversationStore

	const departmentPath = useMemo(
		() => getUserDepartmentFirstPath(conversationUser)?.split("/") || [],
		[conversationUser],
	)

	const { data: departments = [] } = useContactStore((state) =>
		state.useDepartmentInfos(departmentPath, 1, true),
	)

	const onSettingClick = useMemoizedFn(() => {
		conversationStore.toggleSettingOpen()
	})

	return (
		<Flex vertical>
			<Flex
				gap={8}
				align="center"
				justify="space-between"
				className={cx(styles.header, className)}
			>
				<Flex gap={8} align="center" flex={1}>
					<MagicMemberAvatar uid={conversationUser?.user_id} />
					<Flex vertical flex={1}>
						<span className={styles.headerTitle}>{getUserName(conversationUser)}</span>
						<span className={styles.headerTopic}>
							{departments?.map((d) => d?.name).join("/")}
							{getUserJobTitle(conversationUser) &&
								` | ${getUserJobTitle(conversationUser)}`}
						</span>
					</Flex>
				</Flex>
				<Flex gap={2}>
					{/* <MagicButton
						key={ExtraSectionKey.Topic}
						className={cx({
							[styles.extraSectionButtonActive]: topicOpen,
						})}
						tip={t("chat.topic.topic")}
						type="text"
						icon={
							<MagicIcon
								size={20}
								color="currentColor"
								component={IconMessageTopic}
							/>
						}
						onClick={onTopicClick}
					/> */}

					<MagicButton
						key={ExtraSectionKey.Setting}
						className={cx({
							[styles.extraSectionButtonActive]: settingOpen,
						})}
						tip={t("chat.setting")}
						type="text"
						icon={<MagicIcon size={20} color="currentColor" component={IconDots} />}
						onClick={onSettingClick}
					/>
				</Flex>
			</Flex>
			<CurrentTopic />
		</Flex>
	)
}

const UserHeader = observer(HeaderRaw)

export default UserHeader
