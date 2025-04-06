import { memo } from "react"

import type { GroupCreateMessage } from "@/types/chat/conversation_message"
import type { HTMLAttributes } from "react"
import { useTranslation } from "react-i18next"
import MagicMemberAvatar from "@/opensource/components/business/MagicMemberAvatar"
import { getUserName } from "@/utils/modules/chat"
import { useTipStyles } from "../../../../hooks/useTipStyles"

interface GroupCreateTipProps extends Omit<HTMLAttributes<HTMLDivElement>, "content"> {
	content?: GroupCreateMessage
}

const GroupCreateTip = memo(({ content, className, onClick }: GroupCreateTipProps) => {
	const { styles, cx } = useTipStyles()
  const { t } = useTranslation("interface")

  if (!content) {
    return null
  }

	return (
		<div className={cx(styles.container, className)} onClick={onClick}>
			<MagicMemberAvatar
				uid={content?.group_create.group_owner_id}
				showAvatar={false}
				showName="vertical"
			>
				{(user) => <span className={styles.highlight}>{getUserName(user)}</span>}
			</MagicMemberAvatar>{" "}
			{t("chat.groupCreateTip.createGroup")}
		</div>
	)
})

export default GroupCreateTip
