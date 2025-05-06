import MagicIcon from "@/opensource/components/base/MagicIcon"
import ShareModal from "@/opensource/pages/superMagic/components/Share/Modal"
import { ResourceType, ShareType } from "@/opensource/pages/superMagic/components/Share/types"
import {
	createShareTopic,
	deleteThread,
	editThread,
	getTopicsByWorkspaceId,
} from "@/opensource/pages/superMagic/utils/api"
import { IconChevronDown, IconChevronRight, IconDots, IconPlus } from "@tabler/icons-react"
import type { InputRef, MenuProps } from "antd"
import { Button, Dropdown, Input, message, Modal, Tooltip, Typography } from "antd"
import { cx } from "antd-style"
import type { ChangeEvent, KeyboardEvent, MouseEvent, ReactNode } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { FileItem, Thread, Workspace } from "../../pages/Workspace/types"
import AttachmentList from "../AttachmentList"

import TopicIcon from "../TopicIcon"
import useStyles from "./style"

const { Text } = Typography

interface WorkspacePanelProps {
	workspaces: Workspace[]
	onWorkspacesChange: (workspaces: Workspace[]) => void
	onSelectThread?: (thread: any) => void
	selectedWorkspaceId: string | null
	selectedThreadInfo?: any
	attachments?: FileItem[]
	setUserSelectDetail?: (detail: any) => void
	setSelectedThreadInfo?: (thread: any) => void
}

const WorkspacePanel = ({
	workspaces,
	onWorkspacesChange,
	onSelectThread,
	selectedWorkspaceId,
	selectedThreadInfo,
	attachments,
	setUserSelectDetail,
	setSelectedThreadInfo,
}: WorkspacePanelProps) => {
	const { styles } = useStyles()
	const [editingThreadId, setEditingThreadId] = useState<string | null>(null)
	const [editingWorkspaceParentId, setEditingWorkspaceParentId] = useState<string | null>(null)
	const [editingName, setEditingName] = useState("")
	const [isCollapsed, setIsCollapsed] = useState(false)
	const [threadSearchText, setThreadSearchText] = useState("")
	const [shareModalVisible, setShareModalVisible] = useState(false)
	const [currentThread, setCurrentThread] = useState<Thread | null>(null)

	const inputRef = useRef<InputRef>(null)

	const shareTypes = useMemo(() => [ShareType.OnlySelf, ShareType.Internet], [])
	// 组件初次挂载时默认选中第一个工作区和第一个话题
	useEffect(() => {
		if (workspaces.length > 0 && onSelectThread && selectedWorkspaceId) {
			// 当有选中的工作区，但没有选中的话题时
			const currentWorkspace = workspaces.find((ws) => ws.id === selectedWorkspaceId)

			if (currentWorkspace && !selectedThreadInfo?.id && currentWorkspace.topics.length > 0) {
				// 如果没有选中的话题，则选中第一个话题
				const firstTopic = currentWorkspace.topics[0]
				onSelectThread(firstTopic)
			}
		}
	}, [workspaces, selectedWorkspaceId, selectedThreadInfo, onSelectThread])

	useEffect(() => {
		if (inputRef.current && editingThreadId) {
			inputRef.current.focus()
		}
	}, [editingThreadId])

	const handleRenameThread = (workspaceId: string, threadId: string, name: string) => {
		const trimmedName = name.trim()
		onWorkspacesChange(
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

	const handleDeleteThread = useCallback(
		(workspaceId: string, threadId: string) => {
			deleteThread({ id: threadId, workspace_id: workspaceId })
				.then(() => {
					const updatedWorkspaces = workspaces.map((ws) =>
						ws.id === workspaceId
							? {
									...ws,
									topics: ws.topics.filter((thread) => thread.id !== threadId),
							  }
							: ws,
					)

					onWorkspacesChange(updatedWorkspaces)
					// 只有在删除的是当前选中的话题时，才自动选中第一个话题
					if (threadId === selectedThreadInfo?.id && onSelectThread) {
						const updatedWorkspace = updatedWorkspaces.find(
							(ws) => ws.id === workspaceId,
						)
						if (updatedWorkspace && updatedWorkspace.topics.length > 0) {
							onSelectThread(updatedWorkspace.topics[0])
						} else if (updatedWorkspace && updatedWorkspace.topics.length === 0) {
							// 当工作区没有剩余话题时，将选中的话题设置为null
							onSelectThread(null as any)
						}
					}
				})
				.catch((err) => {
					console.log(err, "err")
				})
		},
		[workspaces, selectedThreadInfo, onSelectThread, onWorkspacesChange],
	)

	const handleSelectThreadInternal = (thread: any) => {
		if (onSelectThread) {
			onSelectThread(thread)
		}
	}

	const handleStartEditThread = (workspaceId: string, thread: Thread, e: MouseEvent) => {
		e.stopPropagation()
		setEditingThreadId(thread.id)
		setEditingWorkspaceParentId(workspaceId)
		setEditingName(thread.topic_name)
	}

	const handleStartAddThread = (workspaceId: string, e: MouseEvent) => {
		e.stopPropagation()

		// 直接创建新话题，不需要用户输入
		editThread({
			topic_name: "新话题",
			workspace_id: workspaceId,
		})
			.then((res: any) => {
				console.log("新建话题返回结果:", res)
				// 无论返回结果如何，都获取最新的话题列表
				getTopicsByWorkspaceId({ id: workspaceId || "", page: 1, page_size: 999 })
					.then((topicsRes: any) => {
						console.log(topicsRes, "topicsResponsetopicsResponse")
						const newTopic = topicsRes?.list.find((topic: any) => topic?.id === res?.id)
						console.log(newTopic, "newTopicnewTopicnewTopic")
						if (setSelectedThreadInfo && newTopic) {
							setSelectedThreadInfo(newTopic)
						}
						console.log("获取话题列表返回结果:", topicsRes)

						// 先更新工作区的话题列表
						const updatedWorkspaces = workspaces.map((ws) =>
							ws.id === workspaceId
								? {
										...ws,
										topics: [...topicsRes.list],
								  }
								: ws,
						)
						onWorkspacesChange(updatedWorkspaces)
					})
					.catch((err) => {
						console.error("获取话题列表失败:", err)
					})
			})
			.catch((err) => {
				console.error("创建话题失败:", err)
			})
	}

	const resetEditing = () => {
		setEditingThreadId(null)
		setEditingWorkspaceParentId(null)
		setEditingName("")
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

	const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
		setEditingName(e.target.value)
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

	const handleShareThread = (workspaceId: string, thread: Thread) => {
		console.log("handleShareThread", { workspaceId, thread })
		setCurrentThread(thread)
		setShareModalVisible(true)
	}

	const handleShareModalClose = () => {
		console.log("handleShareModalClose")
		setShareModalVisible(false)
		setCurrentThread(null)
	}

	const handleShareSave = ({ type, extraData }: { type: ShareType; extraData: any }) => {
		// 实现保存分享设置的逻辑
		// message.success("分享设置已保存")
		console.log("handleShareSave")
		const data = {
			resource_id: currentThread?.id || "",
			resource_type: ResourceType.Topic,
			share_type: type,
		} as any
		if (extraData.passwordEnabled) {
			data.pwd = extraData.password
		}
		createShareTopic(data)
			.then((res: any) => {
				message.success("分享设置已保存")
				console.log("创建分享话题返回结果:", res)
				// setShareModalVisible(false)
				// setCurrentThread(null)
			})
			.catch((err: any) => {
				message.error("创建分享话题失败")
				console.error("创建分享话题失败:", err)
			})
	}

	const getThreadMenu = (workspaceId: string, thread: Thread): MenuProps["items"] => [
		{
			key: "share",
			label: "分享",
			onClick: (info: any) => {
				info.domEvent.stopPropagation()
				handleShareThread(workspaceId, thread)
			},
		},
		{
			key: "rename",
			label: "重命名",
			onClick: (info: any) => {
				handleStartEditThread(workspaceId, thread, info.domEvent as MouseEvent)
			},
		},
		{
			key: "delete",
			label: "删除",
			danger: true,
			onClick: (info) => {
				info.domEvent.stopPropagation()
				Modal.confirm({
					title: "确认删除",
					content: `确定要删除对话 "${thread.topic_name}" 吗？`,
					onOk: () => handleDeleteThread(workspaceId, thread.id),
				})
			},
		},
	]

	const selectedWorkspace = workspaces.find((ws) => ws.id === selectedWorkspaceId)

	// 过滤话题列表
	const filteredThreads = useMemo(() => {
		if (!selectedWorkspace?.topics) return []
		if (!threadSearchText.trim()) return selectedWorkspace.topics

		return selectedWorkspace.topics.filter((thread) =>
			(thread.topic_name || "").toLowerCase().includes(threadSearchText.toLowerCase()),
		)
	}, [selectedWorkspace?.topics, threadSearchText])

	return (
		<div className={styles.container}>
			<div className={styles.threadContainer}>
				{/* 话题列表区域 */}
				<div className={cx(styles.section, isCollapsed && styles.collapsed)}>
					<div className={styles.header}>
						<div className={styles.titleContainer}>
							<Button
								type="text"
								size="small"
								icon={
									<MagicIcon
										size={18}
										component={isCollapsed ? IconChevronRight : IconChevronDown}
										stroke={2}
									/>
								}
								onClick={() => {
									setIsCollapsed(!isCollapsed)
								}}
								className={styles.iconButton}
							/>
							<span>话题列表</span>
						</div>
					</div>
					{!isCollapsed && (
						<div className={styles.content}>
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

									<div
										className={styles.newTopicButton}
										onClick={(e) =>
											handleStartAddThread(selectedWorkspace.id, e)
										}
									>
										<MagicIcon
											size={18}
											component={IconPlus}
											stroke={2}
											className={styles.newTopicButtonIcon}
										/>
										<span>新建话题</span>
									</div>

									{!!filteredThreads.length && (
										<div className={styles.listContainer}>
											{filteredThreads.map((thread) => {
												return (
													<div
														key={thread.id}
														className={
															thread.id === selectedThreadInfo?.id
																? styles.threadItemSelected
																: styles.threadItem
														}
														onClick={() =>
															handleSelectThreadInternal(thread)
														}
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
																<Tooltip
																	title={thread.topic_name}
																	placement="right"
																>
																	<Text
																		className={styles.ellipsis}
																	>
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
																	onClick={(e) =>
																		e.stopPropagation()
																	}
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
					)}
				</div>

				{/* 话题文件区域 */}
				<AttachmentList
					attachments={attachments || []}
					setUserSelectDetail={setUserSelectDetail}
				/>
			</div>
			{/* 分享弹窗 */}
			{currentThread && (
				<ShareModal
					open={shareModalVisible}
					types={shareTypes}
					shareContext={{
						resource_id: currentThread.id,
						resource_type: ResourceType.Topic,
					}}
					afterSubmit={handleShareSave}
					onCancel={handleShareModalClose}
				/>
			)}
		</div>
	)
}

export default WorkspacePanel
