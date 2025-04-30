import MagicIcon from "@/opensource/components/base/MagicIcon"
import TopicIcon from "@/opensource/pages/superMagic/components/TopicIcon"
import type { Workspace } from "@/opensource/pages/superMagic/pages/Workspace/types"
import { IconChevronDown, IconChevronUp, IconDeviceImac, IconPlus } from "@tabler/icons-react"
import { cx } from "antd-style"
import { memo, useState } from "react"
import MobileButton from "../MobileButton"
import { useStyles } from "./styles"

interface WorkspaceListProps {
	workspaces?: Workspace[]
	workspaceSelected?: string
	topicSelected?: string
	onTopicSelected?: any
	onAddTopicButtonClick?: (workspace: string) => void
	setSelectedWorkspace?: (workspace: Workspace) => void
	setVisible?: (visible: boolean) => void
}

export default memo(function WorkspaceList(props: WorkspaceListProps) {
	const {
		workspaces,
		workspaceSelected,
		topicSelected,
		onTopicSelected,
		onAddTopicButtonClick,
		setSelectedWorkspace,
		setVisible,
	} = props

	const { styles } = useStyles()

	const [activeWorkspace, setActiveWorkspace] = useState<string | null>(workspaceSelected || null)

	const getWorkspaceStatusClassName = (workspace: Workspace) => {
		let dotClassName = styles.empty
		if (workspace.topics.length > 0) {
			if (workspace.topics.some((topic) => topic.task_status === "running")) {
				dotClassName = styles.running
			} else if (workspace.topics.some((topic) => topic.task_status === "finished")) {
				dotClassName = styles.success
			}
		}
		return dotClassName
	}

	return (
		<div className={styles.container}>
			{workspaces?.map((workspaceItem) => {
				const workspaceActive = activeWorkspace === workspaceItem.id
				return (
					<div
						key={workspaceItem.id}
						className={cx(
							styles.workspaceItem,
							workspaceActive && styles.workspaceItemActive,
						)}
					>
						<div
							className={styles.info}
							onClick={() => {
								setActiveWorkspace?.(workspaceActive ? null : workspaceItem.id)
							}}
						>
							<MagicIcon
								size={18}
								stroke={2}
								component={IconDeviceImac}
								className={getWorkspaceStatusClassName(workspaceItem)}
							/>
							<div className={cx(styles.name, workspaceActive && styles.nameActive)}>
								{workspaceItem.name}
							</div>
							<MagicIcon
								size={18}
								stroke={2}
								component={workspaceActive ? IconChevronUp : IconChevronDown}
							/>
						</div>
						{workspaceActive && (
							<div className={styles.workspaceContent}>
								<div className={styles.workspaceButtons}>
									<MobileButton
										borderDisabled
										className={styles.addTopicButton}
										onClick={() => {
											setVisible?.(false)
											onAddTopicButtonClick?.(workspaceItem.id)
										}}
									>
										<MagicIcon size={18} component={IconPlus} stroke={2} />
										<span>新建话题</span>
									</MobileButton>
									{/* <MobileButton borderDisabled className={styles.settingsButton}>
										<MagicIcon size={18} component={IconSettings} stroke={2} />
									</MobileButton> */}
								</div>
								<div className={styles.topicContainer}>
									{workspaceItem.topics.map((topicItem) => {
										const topicActive = topicSelected === topicItem.id
										return (
											<div
												key={topicItem.id}
												className={cx(
													styles.topicItem,
													topicActive && styles.topicItemActive,
												)}
												onClick={() => {
													setVisible?.(false)
													onTopicSelected?.(topicItem)
													setSelectedWorkspace?.(workspaceItem)
												}}
											>
												<TopicIcon status={topicItem.task_status} />
												<div className={styles.topicItemName}>
													{topicItem.topic_name}
												</div>
												{topicActive && (
													<div className={styles.current}>当前位置</div>
												)}
											</div>
										)
									})}
								</div>
							</div>
						)}
					</div>
				)
			})}
		</div>
	)
})
