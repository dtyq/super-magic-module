import LoadingMessage from "@/opensource/pages/superMagic/components/LoadingMessage"
import Node from "@/opensource/pages/superMagic/components/MessageList/components/Node"
import { memo } from "react"
import type { MessageItem } from "../../pages/workspace/types"
import { useStyles } from "./styles"

interface MessageListProps {
	data?: MessageItem[]
	showLoading?: boolean
	onSelectDetail?: (detail: any) => void
}

export default memo(function MessageList(props: MessageListProps) {
	const { data, showLoading, onSelectDetail } = props
	const { styles } = useStyles()

	return (
		<div className={styles.list}>
			{data?.map((item: any, index: number) => {
				return (
					<Node
						node={item}
						key={item.seq_id}
						prevNode={index > 0 ? data[index - 1] : undefined}
						isSelected
						onSelectDetail={onSelectDetail}
					/>
				)
			})}
			{(data?.length === 1 || showLoading) && <LoadingMessage />}
		</div>
	)
})
