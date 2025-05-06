import MagicIcon from "@/opensource/components/base/MagicIcon"
import MessageList from "@/opensource/pages/superMagic/components/MessageList/index"
import { editThread, getWorkspaces } from "@/opensource/pages/superMagic/utils/api"
import { IconChevronDown, IconChevronRight, IconDots } from "@tabler/icons-react"
import type { InputRef, MenuProps } from "antd"
import { Button, Dropdown, Input, Modal, Tooltip, Typography } from "antd"
import { isEmpty } from "lodash-es"
import type { ChangeEvent, KeyboardEvent } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import WorkspaceIcon from "../../assets/svg/workspace_icon.svg"
import Detail from "../../components/Detail"
import TopicIcon from "../../components/TopicIcon"
import type { Workspace } from "../Workspace/types"
import useStyles from "./style"

const { Text } = Typography

export default function ArchivedWorkspaces() {
	const { styles } = useStyles()
	const [workspaces, setWorkspaces] = useState<Workspace[]>([])
	const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null)
	const [selectedThread, setSelectedThread] = useState<any>(null)
	const [detail, setDetail] = useState<any>(null)
	const [workspaceSearchText, setWorkspaceSearchText] = useState("")
	const [threadSearchText, setThreadSearchText] = useState("")
	const [workspaceIsCollapsed, setWorkspaceIsCollapsed] = useState(false)
	const [threadIsCollapsed, setThreadIsCollapsed] = useState(false)
	const [editingThreadId, setEditingThreadId] = useState<string | null>(null)
	const [editingWorkspaceParentId, setEditingWorkspaceParentId] = useState<string | null>(null)
	const inputRef = useRef<InputRef>(null)
	const [editingName, setEditingName] = useState("")

	useEffect(() => {
		getWorkspaces().then((res: any) => {
			setWorkspaces(res.list)
		})
	}, [])

	useEffect(() => {
		if (workspaces?.length > 0 && isEmpty(selectedWorkspace)) {
			setSelectedWorkspace(workspaces[0])
		}
	}, [workspaces, selectedWorkspace])

	useEffect(() => {
		if (!isEmpty(selectedWorkspace)) {
			setSelectedThread(selectedWorkspace?.topics[0])
		}
	}, [selectedWorkspace])

	// 过滤工作区列表
	const filteredWorkspaces = useMemo(() => {
		if (!workspaces) return []
		if (!workspaceSearchText.trim()) return workspaces

		return workspaces.filter((workspace) =>
			(workspace.name || "").toLowerCase().includes(workspaceSearchText.toLowerCase()),
		)
	}, [workspaces, workspaceSearchText])

	// 过滤话题列表
	const filteredThreads = useMemo(() => {
		if (!selectedWorkspace?.topics) return []
		if (!threadSearchText.trim()) return selectedWorkspace.topics

		return selectedWorkspace.topics.filter((thread) =>
			(thread.topic_name || "").toLowerCase().includes(threadSearchText.toLowerCase()),
		)
	}, [selectedWorkspace, threadSearchText])

	const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
		setEditingName(e.target.value)
	}

	const resetEditing = () => {
		setEditingThreadId(null)
		setEditingWorkspaceParentId(null)
		setEditingName("")
	}
	const handleRenameThread = (workspaceId: string, threadId: string, name: string) => {
		const trimmedName = name.trim()
		setWorkspaces(
			workspaces.map((ws) =>
				ws.id === workspaceId
					? {
							...ws,
							topics: ws.topics.map((thread) =>
								thread.id === threadId
									? { ...thread, topic_name: trimmedName }
									: thread,
							),
					  }
					: ws,
			),
		)
	}

	const handleSave = () => {
		const trimmedName = editingName.trim()
		if (trimmedName === "") return
		if (editingThreadId && editingWorkspaceParentId) {
			editThread({
				workspace_id: editingWorkspaceParentId,
				topic_name: trimmedName,
				id: editingThreadId,
			}).then(() => {
				handleRenameThread(editingWorkspaceParentId, editingThreadId, trimmedName)
			})
		}
		resetEditing()
	}

	const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			handleSave()
		} else if (e.key === "Escape") {
			resetEditing()
		}
	}

	const handleInputBlur = () => {
		setTimeout(() => {
			const trimmedName = editingName.trim()
			if (trimmedName !== "") {
				handleSave()
			} else {
				resetEditing()
			}
		}, 100)
	}

	const getThreadMenu = (workspaceId: string, thread: any): any => [
		{
			key: "share",
			label: "分享",
			onClick: (info: any) => {
				info.domEvent.stopPropagation()
				// handleShareThread(workspaceId, thread)
			},
		},
		{
			key: "rename",
			label: "重命名",
			onClick: (info: any) => {
				// handleStartEditThread(workspaceId, thread, info.domEvent as MouseEvent)
			},
		},
		{
			key: "delete",
			label: "删除",
			danger: true,
			onClick: () => {
				Modal.confirm({
					title: "确认删除",
					content: `确定要删除对话 "${thread.topic_name}" 吗？`,
					// onOk: () => handleDeleteThread(workspaceId, thread.id),
				})
			},
		},
	]

	// 获取工作区菜单
	const getWorkspaceMenu = useCallback(
		(workspace: Workspace): MenuProps["items"] => [
			{
				key: "archive",
				label: "归档",
				onClick: (info) => {
					info?.domEvent?.stopPropagation()
					console.log("归档", workspace)
				},
			},
			{
				key: "rename",
				label: "重命名",
				onClick: (info) => {
					info?.domEvent?.stopPropagation()
					// onStartEditWorkspace(workspace, info.domEvent as React.MouseEvent)
				},
			},
			{
				key: "delete",
				label: "删除",
				danger: true,
				onClick: (info) => {
					info?.domEvent?.stopPropagation()
					// onDeleteWorkspace(workspace.id)
				},
			},
		],
		[],
	)

	return (
		<div className={styles.container}>
			<div className={styles.workspacePanel}>
				<div className={styles.section}>
					<div className={styles.header}>
						<div className={styles.titleContainer}>
							<Button
								type="text"
								size="small"
								icon={
									<MagicIcon
										size={18}
										component={
											workspaceIsCollapsed
												? IconChevronRight
												: IconChevronDown
										}
										stroke={2}
									/>
								}
								onClick={() => setWorkspaceIsCollapsed(!workspaceIsCollapsed)}
								className={styles.iconButton}
							/>
							<span>工作区列表</span>
						</div>
					</div>

					<div
						className={`${styles.content} ${
							workspaceIsCollapsed ? styles.collapsed : ""
						}`}
					>
						{workspaces?.length > 0 && (
							<>
								<div className={styles.searchContainer}>
									<Input
										placeholder="搜索工作区"
										value={workspaceSearchText}
										onChange={(e) => setWorkspaceSearchText(e.target.value)}
										className={styles.searchInput}
									/>
								</div>

								{!!filteredWorkspaces.length && (
									<div className={styles.listContainer}>
										{filteredWorkspaces.map((workspace: Workspace) => {
											return (
												<div
													key={workspace.id}
													className={
														workspace.id === selectedWorkspace?.id
															? styles.threadItemSelected
															: styles.threadItem
													}
													onClick={() => setSelectedWorkspace(workspace)}
												>
													<div className={styles.threadTitle}>
														<img
															src={WorkspaceIcon}
															alt=""
															// status={workspace?.status}
															className={styles.threadTitleImage}
														/>
														{editingThreadId === workspace.id &&
														editingWorkspaceParentId ===
															selectedWorkspace?.id ? (
															<Input
																ref={inputRef}
																className={styles.inlineInput}
																value={editingName || ""}
																onChange={handleInputChange}
																onBlur={handleInputBlur}
																onKeyDown={handleInputKeyDown}
																autoFocus
															/>
														) : (
															<Tooltip title={workspace.name}>
																<Text className={styles.ellipsis}>
																	{workspace.name}
																</Text>
															</Tooltip>
														)}
													</div>

													{!(
														editingThreadId === workspace.id &&
														editingWorkspaceParentId ===
															selectedWorkspace?.id
													) && (
														<Dropdown
															menu={{
																items: getWorkspaceMenu(workspace),
															}}
															trigger={["click"]}
														>
															<Button
																className={
																	styles.threadItemMoreButton
																}
																type="text"
																size="small"
																onClick={(e) => e.stopPropagation()}
															>
																<MagicIcon
																	size={18}
																	component={IconDots}
																	stroke={2}
																	className={
																		styles.threadItemMoreButtonIcon
																	}
																/>
															</Button>
														</Dropdown>
													)}
												</div>
											)
										})}
									</div>
								)}
								{filteredThreads.length === 0 && threadSearchText && (
									<div className={styles.emptyText}>未找到相关话题</div>
								)}
							</>
						)}
					</div>
				</div>
				<div className={styles.section}>
					<div className={styles.header}>
						<div className={styles.titleContainer}>
							<Button
								type="text"
								size="small"
								icon={
									<MagicIcon
										size={18}
										component={
											threadIsCollapsed ? IconChevronRight : IconChevronDown
										}
										stroke={2}
									/>
								}
								onClick={() => setThreadIsCollapsed(!threadIsCollapsed)}
								className={styles.iconButton}
							/>
							<span>话题列表</span>
						</div>
					</div>

					<div
						className={`${styles.content} ${threadIsCollapsed ? styles.collapsed : ""}`}
					>
						{selectedWorkspace && (
							<>
								<div className={styles.searchContainer}>
									<Input
										placeholder="搜索话题"
										value={threadSearchText}
										onChange={(e) => setThreadSearchText(e.target.value)}
										className={styles.searchInput}
									/>
								</div>

								{!!filteredThreads.length && (
									<div className={styles.listContainer}>
										{filteredThreads.map((thread) => {
											return (
												<div
													key={thread.id}
													className={
														thread.id === selectedThread?.id
															? styles.threadItemSelected
															: styles.threadItem
													}
													onClick={() => setSelectedThread(thread)}
												>
													<div className={styles.threadTitle}>
														<TopicIcon
															status={thread.task_status}
															className={styles.threadTitleImage}
														/>
														{editingThreadId === thread.id &&
														editingWorkspaceParentId ===
															selectedWorkspace.id ? (
															<Input
																ref={inputRef}
																className={styles.inlineInput}
																value={editingName || ""}
																onChange={handleInputChange}
																onBlur={handleInputBlur}
																onKeyDown={handleInputKeyDown}
																autoFocus
															/>
														) : (
															<Tooltip title={thread.topic_name}>
																<Text className={styles.ellipsis}>
																	{thread.topic_name}
																</Text>
															</Tooltip>
														)}
													</div>

													{!(
														editingThreadId === thread.id &&
														editingWorkspaceParentId ===
															selectedWorkspace.id
													) && (
														<Dropdown
															menu={{
																items: getThreadMenu(
																	selectedWorkspace.id,
																	thread,
																),
															}}
															trigger={["click"]}
														>
															<Button
																className={
																	styles.threadItemMoreButton
																}
																type="text"
																size="small"
																onClick={(e) => e.stopPropagation()}
															>
																<MagicIcon
																	size={18}
																	component={IconDots}
																	stroke={2}
																	className={
																		styles.threadItemMoreButtonIcon
																	}
																/>
															</Button>
														</Dropdown>
													)}
												</div>
											)
										})}
									</div>
								)}
								{filteredThreads.length === 0 && threadSearchText && (
									<div className={styles.emptyText}>未找到相关话题</div>
								)}
							</>
						)}
					</div>
				</div>
			</div>
			<div className={styles.detailContainer}>
				<Detail disPlayDetail={detail} />
			</div>
			<div className={styles?.messageList}>
				<MessageList
					data={[]}
					selectedThreadInfo={selectedThread}
					setSelectedDetail={setDetail}
				/>
			</div>
		</div>
	)
}
