import MagicIcon from "@/opensource/components/base/MagicIcon"
import TopicIcon from "@/opensource/pages/superMagic/components/TopicIcon"
import type { Thread, Workspace } from "@/opensource/pages/superMagic/pages/Workspace/types"
import { IconChevronDown, IconPlus, IconX } from "@tabler/icons-react"
import { Popup, SafeArea } from "antd-mobile"
import type { Ref } from "react"
import { forwardRef, memo, useImperativeHandle, useState } from "react"
import MobileButton from "../MobileButton"
import WorkspaceList from "../WorkspaceList"
import { useStyles } from "./styles"

export interface WorkspaceSelectRef {
	close: () => void
}

interface WorkspaceSelectProps {
	workspaces?: Workspace[]
	selectedWorkspace?: Workspace
	selectedTopic?: Thread
	setSelectedThreadInfo?: (workspace: string, topic: string) => void
	onAddTopicButtonClick?: (workspace: string) => void
	onAddWorkspaceButtonClick?: () => void
	setSelectedWorkspace?: (workspace: Workspace) => void
}

function WorkspaceSelect(props: WorkspaceSelectProps, ref: Ref<WorkspaceSelectRef>) {
	const {
		workspaces,
		selectedWorkspace,
		selectedTopic,
		setSelectedThreadInfo,
		onAddTopicButtonClick,
		onAddWorkspaceButtonClick,
		setSelectedWorkspace,
	} = props
	const { styles } = useStyles()
	const [visible, setVisible] = useState(false)
	const workspaceName = selectedWorkspace?.name
	const topicName = selectedTopic?.topic_name

	useImperativeHandle(ref, () => {
		return {
			close: () => {
				setVisible(false)
			},
		}
	})
	return (
		<>
			<div className={styles.container} onClick={() => setVisible(true)}>
				<TopicIcon size={18} status={selectedTopic?.task_status} />
				<div className={styles.name}>
					{workspaceName} / {topicName}
				</div>
				<MagicIcon
					size={18}
					stroke={2}
					component={IconChevronDown}
					className={styles.icon}
				/>
			</div>
			<Popup
				visible={visible}
				onMaskClick={() => {
					setVisible(false)
				}}
				onClose={() => {
					setVisible(false)
				}}
				position="bottom"
				bodyStyle={{ height: "80dvh" }}
				bodyClassName={styles.popupBody}
			>
				<div className={styles.popupContent}>
					<div className={styles.popupContentHeader}>
						<div className={styles.popupContentHeaderTitle}>工作区</div>
						<div className={styles.popupContentHeaderClose}>
							<MobileButton
								borderDisabled
								className={styles.closeButton}
								onClick={() => {
									setVisible(false)
								}}
							>
								<MagicIcon size={22} stroke={2} component={IconX} />
							</MobileButton>
						</div>
					</div>
					<div className={styles.popupContentBody}>
						<WorkspaceList
							workspaces={workspaces}
							workspaceSelected={selectedWorkspace?.id}
							topicSelected={selectedTopic?.id}
							onAddTopicButtonClick={onAddTopicButtonClick}
							onTopicSelected={setSelectedThreadInfo}
							setSelectedWorkspace={setSelectedWorkspace}
							setVisible={setVisible}
						/>
					</div>
					<div className={styles.popupContentFooter}>
						<div
							className={styles.popupContentFooterContent}
							onClick={onAddWorkspaceButtonClick}
						>
							<MagicIcon size={20} stroke={2} component={IconPlus} />
							<span>新增工作区</span>
						</div>
						<SafeArea position="bottom" />
					</div>
				</div>
			</Popup>
		</>
	)
}

export default memo(forwardRef(WorkspaceSelect))
