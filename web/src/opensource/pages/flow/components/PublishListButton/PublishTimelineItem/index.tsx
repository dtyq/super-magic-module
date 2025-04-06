import { Timeline } from "antd"
import type { FlowDraft } from "@/types/flow"
import type { PublishCardItemProps } from "../PublishCardItem"
import PublishCardItem from "../PublishCardItem"
import styles from "./index.module.less"

type PublishTimelineItemProps = {
	createDate?: string
	versionList: FlowDraft.ListItem[]
} & Pick<PublishCardItemProps, "flow" | "onSwitchDraft">

export default function PublishTimelineItem({
	versionList,
	createDate,
	...props
}: PublishTimelineItemProps) {
	return (
		<Timeline.Item>
			<div className={styles.createDate}>{createDate}</div>
			{versionList.map((version) => {
				return <PublishCardItem key={version.id} version={version} {...props} />
			})}
		</Timeline.Item>
	)
}
