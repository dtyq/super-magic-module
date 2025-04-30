import MagicIcon from "@/opensource/components/base/MagicIcon"
import { IconAlertCircle, IconDots, IconPlus } from "@tabler/icons-react"
import type { InputRef, MenuProps } from "antd"
import { Button, Dropdown, Input, Space } from "antd"
import { createStyles, cx } from "antd-style"
import React, { useMemo, useRef } from "react"
import type { Workspace } from "../../pages/Workspace/types"

const useStyles = createStyles(({ token }) => ({
	workspaceListContainer: {
		display: "flex",
		overflow: "hidden",
		alignItems: "center",
		width: "100%",
		gap: 10,
	},
	workspaceList: {
		flex: 1,
		display: "flex",
		flexDirection: "row",
		alignItems: "center",
		padding: "10px",
		overflow: "auto",
		"&::-webkit-scrollbar": {
			height: "4px",
		},
		"&::-webkit-scrollbar-thumb": {
			backgroundColor: "rgba(0, 0, 0, 0.1)",
			borderRadius: "2px",
		},
		"&::-webkit-scrollbar-track": {
			backgroundColor: "transparent",
		},
		"& .workspace-content": {
			display: "flex",
			alignItems: "center",
			marginRight: "10px",
		},
		"& .workspace-dot": {
			width: "8px",
			height: "8px",
			borderRadius: "50%",
			marginRight: "10px",
		},
		"& .workspace-name": {
			fontSize: "14px",
			fontWeight: "400",
		},
	},
	tips: {
		height: "32px",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#FFF8EB",
		border: `1px solid #1C1D2314`,
		color: "#FF7D00",
		fontSize: "12px",
		marginRight: "10px",
		fontWeight: "400",
		borderRadius: "8px",
		padding: "6px 10px",
		gap: 4,
	},
	tipsIcon: {
		width: "14px",
		height: "14px",
	},
	workspaceTab: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		padding: "0 10px",
		height: "32px",
		borderRadius: "8px",
		transition: "background-color 0.3s",
		cursor: "pointer",
		whiteSpace: "nowrap",
		minWidth: "100px",
		"&:hover": {
			backgroundColor: token.colorBgTextHover,
		},
	},
	workspaceTabSelected: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		padding: "0 10px",
		height: "32px",
		borderRadius: "8px",
		transition: "background-color 0.3s",
		cursor: "pointer",
		backgroundColor: token.magicColorUsages.primaryLight.default,
		whiteSpace: "nowrap",
		minWidth: "100px",
	},
	addWorkspaceButton: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		width: "32px",
		height: "32px",
		borderRadius: "8px",
		transition: "background-color 0.3s",
		cursor: "pointer",
		"&:hover": {
			backgroundColor: token.colorBgTextHover,
		},
	},
	inlineInput: {
		border: "none",
		borderRadius: "4px",
		padding: "0 4px",
		height: "24px",
		backgroundColor: token.colorBgTextActive,
		width: "120px",
	},
	iconDots: {
		flex: "none",
	},
	success: {
		backgroundColor: token.colorSuccess,
	},
	running: {
		backgroundColor: token.colorWarning,
	},
	empty: {
		backgroundColor: token.colorTextTertiary,
	},
	moreIconButton: {
		width: 20,
		height: 20,
	},
	moreIcon: {
		flex: "none",
		color: "inherit",
	},
}))

interface WorkspaceHeaderProps {
	workspaces: Workspace[]
	selectedWorkspace: Workspace | null
	editingWorkspaceId: string | null
	editingName: string
	isAddingWorkspace: boolean
	onWorkspaceSelect: (workspace: Workspace) => void
	onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
	onInputBlur: () => void
	onInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
	onStartEditWorkspace: (workspace: Workspace, e: React.MouseEvent) => void
	onStartAddWorkspace: () => void
	onDeleteWorkspace: (id: string) => void
}

const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
	workspaces,
	selectedWorkspace,
	editingWorkspaceId,
	editingName,
	onWorkspaceSelect,
	onInputChange,
	onInputBlur,
	onInputKeyDown,
	onStartEditWorkspace,
	onStartAddWorkspace,
	onDeleteWorkspace,
}) => {
	const { styles } = useStyles()
	const inputRef = useRef<InputRef>(null)

	// 聚焦输入框
	React.useEffect(() => {
		if (inputRef.current && editingWorkspaceId) {
			inputRef.current.focus()
		}
	}, [editingWorkspaceId])

	// 获取工作区菜单
	const getWorkspaceMenu = React.useCallback(
		(workspace: Workspace): MenuProps["items"] => [
			// {
			// 	key: "archive",
			// 	label: "归档",
			// 	onClick: (info) => {
			// 		info?.domEvent?.stopPropagation()
			// 		console.log("归档", workspace)
			// 	},
			// },
			{
				key: "rename",
				label: "重命名",
				onClick: (info) => {
					info?.domEvent?.stopPropagation()
					onStartEditWorkspace(workspace, info.domEvent as React.MouseEvent)
				},
			},
			{
				key: "delete",
				label: "删除",
				danger: true,
				onClick: (info) => {
					info?.domEvent?.stopPropagation()
					onDeleteWorkspace(workspace.id)
				},
			},
		],
		[onStartEditWorkspace, onDeleteWorkspace],
	)

	const renderWorkspace = useMemo(() => {
		return workspaces.map((workspace) => {
			const workeSpaceType = {
				allTopicFinsed: styles.success,
				hasTopicRunning: styles.running,
				emptyTopic: styles.empty,
			}
			let dotClassName = workeSpaceType.emptyTopic
			if (workspace.topics.length > 0) {
				if (workspace.topics.some((topic) => topic.task_status === "running")) {
					dotClassName = workeSpaceType.hasTopicRunning
				} else if (workspace.topics.some((topic) => topic.task_status === "finished")) {
					dotClassName = workeSpaceType.allTopicFinsed
				}
			}
			return { ...workspace, dotClassName }
		})
	}, [workspaces, styles.empty, styles.running, styles.success])

	return (
		<div className={styles.workspaceListContainer}>
			<Space className={styles.workspaceList} size={6}>
				{renderWorkspace.map((workspace: any) => {
					return (
						<div
							key={workspace.id}
							className={
								workspace.id === selectedWorkspace?.id
									? styles.workspaceTabSelected
									: styles.workspaceTab
							}
							onClick={() => onWorkspaceSelect(workspace)}
						>
							<div className="workspace-content">
								<div className={cx("workspace-dot", workspace.dotClassName)} />
								{editingWorkspaceId === workspace.id ? (
									<Input
										ref={inputRef}
										className={styles.inlineInput}
										value={editingName || ""}
										onChange={onInputChange}
										onBlur={onInputBlur}
										onKeyDown={onInputKeyDown}
										autoFocus
										onClick={(e) => e.stopPropagation()}
									/>
								) : (
									<span className="workspace-name">{workspace.name}</span>
								)}
							</div>
							<Dropdown
								menu={{ items: getWorkspaceMenu(workspace) }}
								trigger={["click"]}
							>
								<Button
									type="text"
									size="small"
									onClick={(e) => e.stopPropagation()}
									className={styles.moreIconButton}
								>
									<MagicIcon
										size={18}
										component={IconDots}
										stroke={2}
										className={styles.moreIcon}
									/>
								</Button>
							</Dropdown>
						</div>
					)
				})}
				<div className={styles.addWorkspaceButton} onClick={onStartAddWorkspace}>
					<MagicIcon size={18} component={IconPlus} stroke={2} />
				</div>
			</Space>
			<div className={styles.tips}>
				<IconAlertCircle className={styles.tipsIcon} />
				最大同时执行的任务 3 个
			</div>
		</div>
	)
}

export default WorkspaceHeader
