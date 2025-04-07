import type { GroupAddMemberMessage } from "@/types/chat/conversation_message"
import MagicMemberAvatar from "@/opensource/components/business/MagicMemberAvatar"
import { useTranslation } from "react-i18next"
import { Fragment } from "react/jsx-runtime"
import { memo, type HTMLAttributes, useEffect } from "react"
import { getUserName } from "@/utils/modules/chat"
import { useTipStyles } from "../../../../hooks/useTipStyles"
import userInfoService from "@/opensource/services/userInfo"

interface InviteMemberTipProps extends Omit<HTMLAttributes<HTMLDivElement>, "content"> {
	content?: GroupAddMemberMessage
}

const InviteMemberTip = memo(({ content, className, onClick }: InviteMemberTipProps) => {
	const { styles, cx } = useTipStyles()
	const { t } = useTranslation("interface")

	// 获取用户信息
	useEffect(() => {
		if (content && content?.group_users_add.user_ids) {
			userInfoService.fetchUserInfos(content.group_users_add.user_ids, 2)
		}
	}, [content])

	if (!content) {
		return null
	}

	return (
		<div className={cx(styles.container, className)} onClick={onClick}>
			<MagicMemberAvatar
				uid={content.group_users_add.operate_user_id}
				showAvatar={false}
				showName="vertical"
			>
				{(user) => <span className={styles.highlight}>{getUserName(user)}</span>}
			</MagicMemberAvatar>{" "}
			{t("chat.inviteMemberTip.invite")}{" "}
			{content.group_users_add.user_ids.map?.((id, index, array) => {
				return (
					<Fragment key={id}>
						<MagicMemberAvatar uid={id} showAvatar={false} showName="vertical">
							{(user) => (
								<span className={styles.highlight}>{getUserName(user)}</span>
							)}
						</MagicMemberAvatar>
						{index === array.length - 1 ? "" : "、"}
					</Fragment>
				)
			})}{" "}
			{t("chat.inviteMemberTip.joinGroupConversation")}
		</div>
	)
})

export default InviteMemberTip
