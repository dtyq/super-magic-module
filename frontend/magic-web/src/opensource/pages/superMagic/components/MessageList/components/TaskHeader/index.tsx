import { Button } from "antd"
import { useState, useEffect } from "react"
import { IconChevronRight, IconChevronDown, IconChecks } from "@tabler/icons-react"
import { SyncOutlined, ClockCircleOutlined } from "@ant-design/icons"
import { useStyles } from "./style"

interface TaskHeaderProps {
	tasks: any[]
	isExpanded: boolean
	onToggleExpand: () => void
}

// 获取状态图标
const getStatusIcon = (status: string) => {
	if (status === "done") return <IconChecks style={{ color: "#43b581" }} />
	if (status === "doing") return <SyncOutlined spin style={{ color: "rgba(28, 29, 35, 0.8)" }} />
	return <ClockCircleOutlined style={{ color: "#747f8d" }} />
}

// 获取任务状态对应的颜色
const getTaskColor = (status: string) => {
	if (status === "doing") return "rgba(28, 29, 35, 0.8)"
	if (status === "done") return "#43b581"
	return "#747f8d"
}

const TaskHeader = ({ tasks, isExpanded, onToggleExpand }: TaskHeaderProps) => {
	const { styles } = useStyles()
	const [currentTask, setCurrentTask] = useState<any | null>(null)

	// 在组件挂载时或任务列表更新时，寻找最后一个正在运行的任务
	useEffect(() => {
		if (tasks && tasks.length > 0) {
			// 先查找正在运行的任务
			const runningTask = [...tasks].reverse().find((task) => task.status === "doing")
			// 如果没有正在运行的任务，就使用第一个任务
			setCurrentTask(runningTask || tasks[0])
		}
	}, [tasks])

	if (!tasks || tasks.length === 0) {
		return null
	}

	return (
		<div className={styles.expandIcon}>
			<span>任务进度</span>
			{!isExpanded && currentTask && (
				<span
					style={{
						marginLeft: "4px",
						display: "flex",
						alignItems: "center",
					}}
				>
					{getStatusIcon(currentTask.status)}
					<span
						style={{
							marginLeft: "4px",
							fontSize: "12px",
							color: getTaskColor(currentTask.status),
						}}
					>
						{currentTask.title}
					</span>
				</span>
			)}
			<Button
				className={styles.iconButton}
				size="small"
				type="text"
				icon={isExpanded ? <IconChevronDown size={18} /> : <IconChevronRight size={18} />}
				onClick={onToggleExpand}
			/>
		</div>
	)
}

export default TaskHeader
