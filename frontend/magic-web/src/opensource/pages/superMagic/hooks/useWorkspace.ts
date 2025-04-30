import { useCallback, useState } from "react"
import type { Workspace } from "../pages/Workspace/types"
import { deleteWorkspace, editWorkspace, getWorkspaces } from "../utils/api"

export function useWorkspace() {
	const [workspaces, setWorkspaces] = useState<Workspace[]>([])
	const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null)
	const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(null)
	const [editingName, setEditingName] = useState("")
	const [isAddingWorkspace, setIsAddingWorkspace] = useState(false)

	// 重置编辑状态
	const resetEditing = useCallback(() => {
		setEditingWorkspaceId(null)
		setEditingName("")
		setIsAddingWorkspace(false)
	}, [])

	// 处理工作区名称输入
	const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setEditingName(e.target.value)
	}, [])

	// 工作区相关操作
	const handleRenameWorkspace = useCallback((id: string, name: string) => {
		setWorkspaces((prev) => {
			return prev.map((ws) => (ws.id === id ? { ...ws, name } : ws))
		})
	}, [])

	const handleAddWorkspace = useCallback((name: string, id?: string) => {
		const trimmedName = name.trim()
		const newWorkspaceId = id || `workspace-${Date.now()}`
		const newWorkspace: any = {
			id: newWorkspaceId,
			name: trimmedName,
			topics: [
				{
					id: id || `thread-${Date.now() + 1}`,
					topic_name: "默认话题",
					sort: "1",
					history: [],
					attachments: [],
				},
			],
			expanded: true,
		}
		setWorkspaces((prev) => [...prev, newWorkspace])
		setSelectedWorkspace(newWorkspace)
	}, [])

	// 加载工作区数据
	const fetchWorkspaces = useCallback(
		(selectedThreadId?: string | null) => {
			return getWorkspaces()
				.then((data: any) => {
					// 保存当前选中的话题ID
					const currentThreadId = selectedThreadId
					const currentWorkspaceId = selectedWorkspace?.id

					if (currentThreadId && currentWorkspaceId) {
						// 如果已有选中的话题和工作区，保持选中状态
						const updatedWorkspaces = data.list.map((workspace: Workspace) => {
							if (workspace.id === currentWorkspaceId) {
								return {
									...workspace,
									topics: workspace.topics.map((topic) => ({
										...topic,
									})),
								}
							}
							return workspace
						})
						setWorkspaces(updatedWorkspaces)
					} else {
						// 如果没有选中的话题和工作区，使用默认选中行为
						setWorkspaces(data?.list)
					}
					return data.list
					// 如果没有工作区，自动创建一个默认工作区
					// return createDefaultWorkspace()
				})
				.catch((err) => {
					console.log(err, "err")
					return []
				})
		},
		[selectedWorkspace],
	)

	// 保存编辑内容
	const handleSave = useCallback(() => {
		console.log(editingName, "editingNameeditingName")
		const trimmedName = (editingName || "").trim()
		if (trimmedName === "") return

		if (editingWorkspaceId) {
			editWorkspace({ id: editingWorkspaceId, workspace_name: trimmedName })
				.then(() => {
					console.log(1111111, editingWorkspaceId, "xxx", trimmedName)
					handleRenameWorkspace(editingWorkspaceId, trimmedName)
				})
				.catch((err) => {
					console.log(err, "err")
				})
		}

		resetEditing()
	}, [editingName, editingWorkspaceId, resetEditing, handleRenameWorkspace])

	// 处理输入框键盘事件
	const handleInputKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Enter") {
				handleSave()
			} else if (e.key === "Escape") {
				resetEditing()
			}
		},
		[handleSave, resetEditing],
	)

	// 处理输入框失焦事件
	const handleInputBlur = useCallback(() => {
		setTimeout(() => {
			console.log(editingName, "handleInputBlur")
			const trimmedName = (editingName || "").trim()
			if (trimmedName !== "") {
				handleSave()
			} else {
				resetEditing()
			}
		}, 100)
	}, [editingName, handleSave, resetEditing])

	const handleStartEditWorkspace = useCallback((workspace: Workspace, e: React.MouseEvent) => {
		e.stopPropagation()
		setEditingWorkspaceId(workspace.id)
		setEditingName(workspace.name || "")
		setIsAddingWorkspace(false)
	}, [])

	const handleStartAddWorkspace = useCallback(() => {
		const defaultWorkspaceName = "新建工作区"
		editWorkspace({ workspace_name: defaultWorkspaceName })
			.then((data: any) => {
				console.log(data, "add workspace")
				if (data?.id) {
					// 创建完成后直接获取最新工作区列表
					getWorkspaces()
						.then((workspacesData: any) => {
							const workspaceList = workspacesData.list || []
							// 更新工作区列表
							setWorkspaces(workspaceList)
							// 不再自动选中新建的工作区
						})
						.catch((err) => {
							console.log(err, "获取工作区列表失败")
						})
				}
			})
			.catch((err) => {
				console.log(err, "创建工作区失败")
			})
	}, [])

	const handleDeleteWorkspace = useCallback(
		(id: string) => {
			deleteWorkspace({ id })
				.then(() => {
					setWorkspaces((prev) => {
						const updatedWorkspaces = prev.filter((ws) => ws.id !== id)
						if (selectedWorkspace?.id === id && updatedWorkspaces.length > 0) {
							setSelectedWorkspace(updatedWorkspaces[0])
						}
						return updatedWorkspaces
					})
				})
				.catch((err) => {
					console.log(err, "err")
				})
		},
		[selectedWorkspace],
	)

	// 创建默认工作区
	// const createDefaultWorkspace = useCallback(() => {
	// 	const defaultWorkspaceName = "默认工作区"
	// 	return editWorkspace({ workspace_name: defaultWorkspaceName })
	// 		.then((createData: any) => {
	// 			if (createData?.id) {
	// 				// 创建成功后，重新获取工作区列表
	// 				return getWorkspaces()
	// 					.then((workspacesData: any) => {
	// 						setWorkspaces(workspacesData.data)
	// 						// 设置选中的工作区为第一个工作区
	// 						const defaultWorkspace = workspacesData.data[0]
	// 						setSelectedWorkspace(defaultWorkspace)

	// 						// 如果工作区有话题，则设置选中的话题ID为第一个话题的ID
	// 						if (defaultWorkspace.topics && defaultWorkspace.topics.length > 0) {
	// 							return {
	// 								workspaces: workspacesData.data,
	// 								defaultThreadId: defaultWorkspace.topics[0].id,
	// 							}
	// 						}
	// 						return { workspaces: workspacesData.data, defaultThreadId: null }
	// 					})
	// 					.catch((err) => {
	// 						console.log(err, "获取工作区列表错误")
	// 						message.error("获取工作区列表失败")
	// 						return { workspaces: [], defaultThreadId: null }
	// 					})
	// 			}
	// 			message.error("创建默认工作区失败")
	// 			return { workspaces: [], defaultThreadId: null }
	// 		})
	// 		.catch((err) => {
	// 			console.log(err, "创建默认工作区错误")
	// 			message.error("创建默认工作区失败")
	// 			return { workspaces: [], defaultThreadId: null }
	// 		})
	// }, [])

	return {
		workspaces,
		setWorkspaces,
		selectedWorkspace,
		setSelectedWorkspace,
		editingWorkspaceId,
		editingName,
		isAddingWorkspace,
		handleInputChange,
		handleInputKeyDown,
		handleInputBlur,
		handleStartEditWorkspace,
		handleStartAddWorkspace,
		handleDeleteWorkspace,
		handleAddWorkspace,
		handleRenameWorkspace,
		fetchWorkspaces,
		resetEditing,
	}
}
