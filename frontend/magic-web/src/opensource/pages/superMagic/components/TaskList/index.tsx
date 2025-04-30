import MagicIcon from "@/opensource/components/base/MagicIcon"
import { CloseCircleFilled } from "@ant-design/icons"
import { IconChecks, IconChevronDown, IconChevronUp, IconCircleCheck } from "@tabler/icons-react"
import { Tooltip } from "antd"
import { useState } from "react"
import type { TaskData } from "../../pages/Workspace/types"
import { useStyles } from "./styles"

// 自定义doing状态的图标组件
const AnimatedDoingIcon = () => {
	const { styles, cx } = useStyles()

	return (
		<div className={cx(styles.doingIconContainer)}>
			<div className={cx(styles.doingIconOuter)} />
			<div className={cx(styles.doingIconPulse)} />
			<div className={cx(styles.doingIconInner)} />
		</div>
	)
}

// 自定义默认图标组件
const DefaultTaskIcon = () => {
	const { styles, cx } = useStyles()

	return (
		<div className={cx(styles.defaultIconContainer)}>
			<div className={cx(styles.defaultIcon)} />
		</div>
	)
}

interface TaskListProps {
	taskData: TaskData | null
	isInChat?: boolean
	className?: string
	style?: React.CSSProperties
	mode?: "view" | "default"
}

function TaskList({ taskData, className, style, mode }: TaskListProps) {
	const [expanded, setExpanded] = useState(mode === "view")

	const { styles, cx } = useStyles()
	// 计算任务完成进度
	const completedTasks = taskData?.process?.filter((task) => task.status === "finished").length

	const totalTasks = taskData?.process?.length

	// 获取当前进行中的任务或最后一个已完成的任务
	const getCurrentTask = () => {
		// 1. 优先查找正在进行中的任务
		const runningTask = taskData?.process?.find((task) => task.status === "running")
		if (runningTask) {
			return runningTask
		}

		// 2. 如果没有进行中的任务，查找第一个待处理的任务
		const todoTask = taskData?.process?.find((task) => task.status === "waiting")
		if (todoTask) {
			return todoTask
		}

		// 3. 如果既没有进行中也没有待处理的任务，返回最后一个已完成的任务
		const doneTasks = taskData?.process?.filter((task) => task.status === "finished") || []
		if (doneTasks.length > 0) {
			return doneTasks[doneTasks.length - 1]
		}

		// 如果没有任何任务，返回第一个任务（如果存在的话）
		return taskData?.process?.[0]
	}

	// 获取任务图标
	const getTaskIcon = (status: string, taskId?: string) => {
		// 检查是否有正在进行中的任务
		const hasDoingTask = taskData?.process?.some((task) => {
			return task.status === "running"
		})
		// 如果没有正在进行中的任务，查找第一个待处理任务
		const firstTodoTask = !hasDoingTask
			? taskData?.process?.find((task) => task.status === "waiting")
			: null

		// 如果当前任务是第一个待处理任务，且没有进行中的任务，显示 waiting 图标
		if (
			!hasDoingTask &&
			firstTodoTask &&
			taskId &&
			taskId === firstTodoTask.id &&
			status === "waiting"
		) {
			return <AnimatedDoingIcon />
		}

		// 原有的逻辑处理
		switch (status) {
			case "finished":
				return expanded ? (
					<IconCircleCheck
						className={cx(styles.statusIcon, styles.statusDone)}
						stroke={1.5}
					/>
				) : (
					<IconChecks className={cx(styles.statusDone)} stroke={1.5} />
				)
			case "running":
				return <AnimatedDoingIcon />
			case "error":
				return <CloseCircleFilled className={cx(styles.statusIcon, styles.statusError)} />
			default:
				return <DefaultTaskIcon />
		}
	}

	// 获取任务状态样式类名
	const getTaskStatusClassName = (status: string) => {
		switch (status) {
			case "finished":
				return styles.taskStatusDone
			case "waiting":
				return styles.taskStatusTodo
			case "error":
				return styles.taskStatusError
			default:
				return styles.taskStatusTodo
		}
	}

	const toggleExpanded = () => {
		if (mode === "view") return
		setExpanded(!expanded)
	}

	// 当前运行/最后一个已完成的任务
	const currentTask = getCurrentTask()

	return (
		<div
			className={cx(styles.container, !expanded && styles.containerCollapsed, className)}
			style={style}
		>
			{!expanded && (
				<>
					{getTaskIcon(currentTask?.status || "waiting", currentTask?.id)}
					<Tooltip title={currentTask?.title}>
						<div
							className={cx(
								styles.currentTaskText,
								!expanded
									? styles.taskStatusDefault
									: getTaskStatusClassName(currentTask?.status || "waiting"),
							)}
						>
							{currentTask?.title}
						</div>
					</Tooltip>
				</>
			)}
			<div
				className={cx(
					styles.containerInner,
					!expanded && styles.containerInnerCollapsed,
					mode === "view" && styles.containerInnerView,
				)}
			>
				<div
					className={cx(styles.header, expanded && styles.headerExpanded)}
					onClick={toggleExpanded}
				>
					<div className={cx(styles.headerLeft, !expanded && styles.headerLeftCollapsed)}>
						{expanded && <div className={styles.title}>任务清单</div>}
					</div>
					{mode === "view" ? null : (
						<div className={styles.headerRight}>
							<div className={styles.progressWrapper}>
								<span className={styles.progressText}>
									{completedTasks} / {totalTasks}
								</span>
							</div>
							<MagicIcon
								size={18}
								component={expanded ? IconChevronDown : IconChevronUp}
							/>
						</div>
					)}
				</div>
				{expanded && (
					<div
						className={styles.taskList}
						style={{ maxHeight: mode === "view" ? "335px" : "240px" }}
					>
						{taskData?.process?.map((task) => (
							<div key={task.id} className={styles.taskItem}>
								<div className={styles.taskIcon}>
									{getTaskIcon(task.status, task.id)}
								</div>
								<Tooltip title={task.title}>
									<div className={styles.taskTitle}>{task.title}</div>
								</Tooltip>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	)
}

export default TaskList
