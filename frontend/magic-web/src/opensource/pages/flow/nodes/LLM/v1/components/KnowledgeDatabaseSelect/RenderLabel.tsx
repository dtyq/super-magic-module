import { IconWindowMaximize } from "@tabler/icons-react"
import { Flex, Tooltip } from "antd"
import styles from "./TeamshareKnowledgeSelect.module.less"

type RenderLabelProps = {
	item: {
		name: string
		business_id: string
	}
}

export default function RenderLabel({ item }: RenderLabelProps) {
	return (
		<Flex align="center" gap={4}>
			<Tooltip title={item.name}>
				<span className={styles.knowledgeName}>{item.name}</span>
			</Tooltip>
			{item.name && (
				<IconWindowMaximize
					onClick={(e) => {
						e.stopPropagation()
						window.open(`/knowledge/directory/${item.business_id}`, "_blank")
					}}
					className={styles.iconWindowMaximize}
					size={20}
				/>
			)}
		</Flex>
	)
}
