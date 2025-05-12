import MagicMemberAvatar from "@/opensource/components/business/MagicMemberAvatar"
import { calculateRelativeSize } from "@/utils/styles"
import { Flex } from "antd"
import type { HTMLAttributes } from "react"
import { memo, useMemo } from "react"
import { getUserName } from "@/utils/modules/chat"
import TextAnimation from "@/opensource/components/animations/TextAnimation"
import { useTranslation } from "react-i18next"
import useUserInfo from "@/opensource/hooks/chat/useUserInfo"
import { observer } from "mobx-react-lite"
import ConversationStore from "@/opensource/stores/chatNew/conversation"
import SearchAnimation from "@/opensource/components/animations/SearchAnimation"
import useChatMessageStyles from "./style"
import { useFontSize } from "@/opensource/providers/AppearanceProvider/hooks"

interface AiConversationMessageLoadingProps extends HTMLAttributes<HTMLDivElement> {
	atBottom?: boolean
	onScrollToBottom?: () => void
}

const AiConversationMessageLoading = observer(
	({ className }: AiConversationMessageLoadingProps) => {
		const { fontSize } = useFontSize()
		const { t } = useTranslation("interface")

		const { styles, cx } = useChatMessageStyles(
			useMemo(
				() => ({
					self: false,
					fontSize,
					isMultipleCheckedMode: false,
				}),
				[fontSize],
			),
		)

		const { userInfo } = useUserInfo(ConversationStore.currentConversation?.receive_id)

		if (
			!ConversationStore.currentConversation?.receive_inputing ||
			!ConversationStore.currentConversation?.isAiConversation
		)
			return null

		return (
			<Flex
				className={cx(styles.container, styles.reverse, className)}
				gap={12}
				data-message-id="ai-conversation-message-loading"
				style={{ willChange: "transform" }}
			>
				<MagicMemberAvatar
					uid={ConversationStore.currentConversation?.receive_id}
					size={calculateRelativeSize(40, fontSize)}
				/>
				<Flex vertical className={cx(styles.message)} gap={4}>
					<Flex className={styles.messageTop} gap={12}>
						{/* 用户名称 */}
						<span className={styles.name}>{getUserName(userInfo)}</span>
					</Flex>
					<Flex
						className={cx(styles.contentInnerWrapper, styles.defaultTheme)}
						gap={8}
						align="center"
						style={{
							width: "126px",
						}}
					>
						<SearchAnimation size={20} />
						<TextAnimation dotwaveAnimation gradientAnimation>
							{t("chat.message.BeThinking")}
						</TextAnimation>
					</Flex>
				</Flex>
			</Flex>
		)
	},
)

const MemoizedAiConversationMessageLoading = memo(AiConversationMessageLoading)

export default MemoizedAiConversationMessageLoading
