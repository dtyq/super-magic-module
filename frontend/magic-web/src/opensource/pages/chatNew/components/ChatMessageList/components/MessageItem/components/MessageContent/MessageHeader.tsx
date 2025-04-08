import { memo, useMemo } from "react"
import { formatTime } from "@/utils/string"
import { Flex } from "antd"
import { useFontSize } from "@/opensource/providers/AppearanceProvider/hooks"
import { useStyles } from "./style"

interface MessageHeaderProps {
	sendTime: number
	isSelf: boolean
	name: string
}

/**
 * 消息头
 */
const MessageHeader = memo(function MessageHeader({ sendTime, isSelf, name }: MessageHeaderProps) {
	const { fontSize } = useFontSize()
	const { styles } = useStyles({ fontSize })

	const formattedTime = useMemo(() => formatTime(sendTime), [sendTime])

	return (
		<Flex
			className={styles.messageInfo}
			align="center"
			gap={4}
			justify={isSelf ? "flex-end" : "flex-start"}
		>
			{!isSelf && <span className={styles.name}>{name}</span>}
			<span className={styles.time}>{formattedTime}</span>
		</Flex>
	)
})

export default MessageHeader
