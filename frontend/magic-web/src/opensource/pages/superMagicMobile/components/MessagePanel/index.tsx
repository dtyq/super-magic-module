import MagicIcon from "@/opensource/components/base/MagicIcon"
import UploadAction from "@/opensource/components/base/UploadAction"
import type { FileItem, TaskData } from "@/opensource/pages/superMagic/pages/Workspace/types"
import { IconFileUpload, IconSend } from "@tabler/icons-react"
import { cx } from "antd-style"
import { isEmpty } from "lodash-es"
import { memo, useMemo, useState } from "react"
import MessagePanelFiles from "../MessagePanelFiles"
import MobileButton from "../MobileButton"
import TaskListItem from "../TaskListItem"
import TaskListProcess from "../TaskListProcess"
import { useStyles } from "./styles"

export interface MessagePanelProps {
	taskData?: TaskData
	fileList?: FileItem[]
	className?: string
	style?: React.CSSProperties
	onFilesSelect?: (files: FileList) => void
	onFileListChange?: (files: FileItem[]) => void
	onSubmit?: (content: string) => void
	handlePullMoreMessage?: () => void
	selectedThreadInfo?: any
	onStopClick?: () => void
	showLoading?: boolean
	dataLength?: number
	setFileList?: (files: FileItem[]) => void
	isEmptyStatus?: boolean
}

export default memo(function MessagePanel(props: MessagePanelProps) {
	const {
		taskData,
		fileList,
		className,
		style,
		onFilesSelect,
		onFileListChange,
		onSubmit,
		onStopClick,
		showLoading,
		dataLength,
		selectedThreadInfo,
		setFileList,
	} = props
	const { styles } = useStyles()
	const [taskCollapsed, setTaskCollapsed] = useState(true)
	const showTask = !!taskData?.process.length
	const [inputValue, setInputValue] = useState("")

	const completedTasks = useMemo(() => {
		return taskData?.process.filter((item: any) => item.status === "finished").length
	}, [taskData])

	const totalTasks = taskData?.process.length
	return (
		<div className={cx(styles.container, className)} style={style}>
			{showTask && (
				<div className={styles.task}>
					{taskCollapsed ? (
						<div
							className={styles.singleTask}
							onClick={() => {
								setTaskCollapsed(false)
							}}
						>
							<TaskListItem
								process={taskData.process}
								data={taskData.process[0]}
								className={cx(styles.taskItem, styles.singleTaskItem)}
							/>
							<TaskListProcess
								min={completedTasks}
								max={totalTasks}
								className={styles.singleTaskProcess}
							/>
						</div>
					) : (
						<div className={styles.multiTask}>
							<div className={styles.multiTaskContent}>
								<div
									className={styles.multiTaskHeader}
									onClick={() => {
										setTaskCollapsed(true)
									}}
								>
									<div className={styles.multiTaskName}>任务清单</div>
									<TaskListProcess
										collapsed={false}
										min={completedTasks}
										max={totalTasks}
									/>
								</div>
								{taskData.process.map((item) => {
									return (
										<TaskListItem
											key={item.id}
											process={taskData.process}
											data={item}
											className={styles.taskItem}
										/>
									)
								})}
							</div>
						</div>
					)}
				</div>
			)}
			<div className={styles.panelContainer}>
				<MessagePanelFiles fileList={fileList} onFileListChange={onFileListChange} />
				<textarea
					value={inputValue}
					className={styles.textarea}
					placeholder={
						showLoading ? "您可以继续和我对话来实时调整任务哦" : "给超级麦吉一个任务..."
					}
					onChange={(e) => {
						setInputValue(e.target.value)
					}}
				/>
				<div className={styles.buttons}>
					<div className={styles.left}>
						<UploadAction
							multiple
							onFileChange={onFilesSelect}
							handler={(trigger) => (
								<MobileButton
									borderDisabled
									className={styles.button}
									onClick={trigger}
								>
									<MagicIcon size={18} stroke={2} component={IconFileUpload} />
									<span>文件</span>
								</MobileButton>
							)}
						/>
					</div>
					<div className={styles.right}>
						{dataLength === 1 ||
							(showLoading && (
								<div
									className={styles.stopButton}
									onClick={() => {
										onStopClick?.()
									}}
								>
									<div className={styles.stopIcon} />
								</div>
							))}
						<MobileButton
							disabled={!inputValue || isEmpty(selectedThreadInfo)}
							className={styles.sendButton}
							onClick={() => {
								onSubmit?.(inputValue)
								setInputValue("")
								setFileList?.([])
							}}
						>
							<MagicIcon size={18} stroke={2} component={IconSend} />
							<span>发送</span>
						</MobileButton>
					</div>
				</div>
			</div>
		</div>
	)
})
