import { useContactStore } from "@/opensource/stores/contact/hooks"
import { ConversationMessageType } from "@/types/chat/conversation_message"
import { Flex } from "antd"
import { createStyles } from "antd-style"
import { type PropsWithChildren } from "react"
import { observer } from "mobx-react-lite"
import ReplyStore from "@/opensource/stores/chatNew/messageUI/Reply"
import MessageTextRender from "../MessageTextRender"

const useStyles = createStyles(({ token, isDarkMode, css }, { isSelf }: { isSelf: boolean }) => {
	const selfBorderColor = isDarkMode
		? token.magicColorUsages.fill[1]
		: token.magicColorUsages.white
	const otherBorderColor = isDarkMode ? token.magicColorScales.grey[4] : token.colorBorder

	return {
		container: {
			borderLeft: `2px solid ${isSelf ? selfBorderColor : otherBorderColor}`,
			paddingLeft: 10,
			opacity: 0.5,
			cursor: "pointer",
			userSelect: "none",
			height: "fit-content",
			overflow: "hidden",
		},
		username: css`
			font-size: 10px;
			line-height: 12px;
		`,
		content: css`
			max-height: 30px;
			overflow-y: auto;
		`,
	}
})

interface ReferMessageProps extends PropsWithChildren {
	isSelf: boolean
	className?: string
	onClick?: (e: React.MouseEvent<HTMLDivElement>) => void
}

function MessageReferComponent({
	isSelf,
	className,
	onClick,
}: ReferMessageProps) {
	const { styles, cx } = useStyles({ isSelf })
	const referFileId = ReplyStore.replyFile?.fileId
  const referText = ReplyStore.replyFile?.referText
  const referMessage = ReplyStore.replyMessage


	const sender = useContactStore((state) =>
		referMessage ? state.userInfos.get(referMessage.sender_id) : undefined,
	)

	if (!referMessage) return null

	if (referMessage.type === ConversationMessageType.AiImage && !referFileId) {
		return null
	}

	return (
		<Flex vertical className={cx(styles.container, className)} gap={2} onClick={onClick}>
			<span className={styles.username}>{sender?.nickname}</span>
			<div className={styles.content}>
        <MessageTextRender
          messageId={referMessage.message_id}
					message={referMessage.message}
					referFileId={referFileId}
					referText={referText}
				/>
			</div>
		</Flex>
	)
}

const MessageRefer = observer(MessageReferComponent)

export default MessageRefer
