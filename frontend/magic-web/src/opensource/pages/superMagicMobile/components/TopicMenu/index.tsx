import MagicModal from "@/opensource/components/base/MagicModal"
import AttachmentList from "@/opensource/pages/superMagic/components/AttachmentList"
import ShareModal from "@/opensource/pages/superMagic/components/Share/Modal"
import { ResourceType, ShareType } from "@/opensource/pages/superMagic/components/Share/types"
import { createShareTopic } from "@/opensource/pages/superMagic/utils/api"
import { IconEdit, IconFolder, IconShare, IconTrash } from "@tabler/icons-react"
// import UserMenus from "@/opensource/layouts/BaseLayout/components/Sider/components/UserMenus"
import { deleteThread, editThread } from "@/opensource/pages/superMagic/utils/api"
import { message } from "antd"
import { Input, Popup, SafeArea } from "antd-mobile"
import { memo, useCallback, useMemo, useState } from "react"
import { useStyles } from "./style"

export default memo(function TopicMenu({
	selectedThreadInfo,
	attachments,
	setUserSelectDetail,
	selectedWorkspace,
	fetchWorkspaces,
	setSelectedThreadInfo,
	workspaces,
	setWorkspaces,
}: any) {
	const { styles, cx } = useStyles()
	const [shareModalVisible, setShareModalVisible] = useState(false)
	const [attachmentVisible, setAttachmentVisible] = useState(false)
	const [renameModalVisible, setRenameModalVisible] = useState(false)
	const [deleteModalVisible, setDeleteModalVisible] = useState(false)
	const [newTopicName, setNewTopicName] = useState("")
	const shareTypes = useMemo(() => [ShareType.OnlySelf, ShareType.Internet], [])
	const [currentThread, setCurrentThread] = useState<any | null>(null)
	const handleShareModalClose = () => {
		setShareModalVisible(false)
		setCurrentThread(null)
	}

	const handleShareSave = ({ type, extraData }: { type: ShareType; extraData: any }) => {
		// 实现保存分享设置的逻辑
		// message.success("分享设置已保存")
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
				// setShareModalVisible(false)
				// setCurrentThread(null)
			})
			.catch((err: any) => {
				message.error("创建分享话题失败")
				console.error("创建分享话题失败:", err)
			})
	}
	const handleRename = useCallback(() => {
		if (!selectedThreadInfo) return
		setNewTopicName(selectedThreadInfo.topic_name || "")
		setRenameModalVisible(true)
	}, [selectedThreadInfo])

	const handleRenameConfirm = useCallback(() => {
		if (!selectedThreadInfo || !newTopicName.trim()) {
			message.error("话题名称不能为空")
			return
		}

		editThread({
			id: selectedThreadInfo.id,
			topic_name: newTopicName.trim(),
			workspace_id: selectedWorkspace.workspace_id,
		})
			.then(() => {
				fetchWorkspaces()
				message.success("重命名成功")
				setRenameModalVisible(false)
				setSelectedThreadInfo((pre: any) => {
					return {
						...pre,
						topic_name: newTopicName.trim(),
					}
				})
			})
			.catch((err) => {
				message.error("重命名失败")
				console.error("重命名话题失败:", err)
			})
	}, [selectedThreadInfo, newTopicName, selectedWorkspace])

	const handleDelete = useCallback(() => {
		if (!selectedThreadInfo) return
		setDeleteModalVisible(true)
	}, [selectedThreadInfo])

	const handleDeleteConfirm = useCallback(() => {
		if (!selectedThreadInfo) return
		handleDeleteThread(selectedWorkspace.id, selectedThreadInfo.id)
	}, [selectedWorkspace, selectedThreadInfo, fetchWorkspaces, workspaces])

	const handleDeleteThread = useCallback(
		(workspaceId: string, threadId: string) => {
			deleteThread({ id: threadId, workspace_id: workspaceId })
				.then(() => {
					const updatedWorkspaces = workspaces.map((ws: any) =>
						ws.id === workspaceId
							? {
									...ws,
									topics: ws.topics.filter(
										(thread: any) => thread.id !== threadId,
									),
							  }
							: ws,
					)

					setWorkspaces(updatedWorkspaces)
					console.log(
						threadId,
						"deletethreadId",
						selectedThreadInfo,
						"selectedThreadInfoxxxxx",
						updatedWorkspaces,
						"updatedWorkspacesupdatedWorkspaces",
						workspaceId,
						"workspaceId",
					)
					// 只有在删除的是当前选中的话题时，才自动选中第一个话题
					if (threadId === selectedThreadInfo?.id && setSelectedThreadInfo) {
						const updatedWorkspace = updatedWorkspaces.find(
							(ws: any) => ws.id === workspaceId,
						)
						if (updatedWorkspace && updatedWorkspace.topics.length > 0) {
							setSelectedThreadInfo(updatedWorkspace.topics[0])
						} else if (updatedWorkspace && updatedWorkspace.topics.length === 0) {
							// 当工作区没有剩余话题时，将选中的话题设置为null
							setSelectedThreadInfo(null as any)
						}
					}
					message.success("删除成功")
					setDeleteModalVisible(false)
				})
				.catch((err) => {
					console.log(err, "err")
				})
		},
		[workspaces, selectedThreadInfo, setSelectedThreadInfo, setWorkspaces],
	)

	return (
		<div className={styles.container}>
			<div className={styles.title}>话题</div>
			<div>
				<div
					className={cx(styles.item)}
					onClick={() => {
						setAttachmentVisible(true)
					}}
				>
					<IconFolder className={styles.icon} /> <span>查看话题文件</span>
				</div>
				<div
					className={styles.item}
					onClick={() => {
						setCurrentThread(selectedThreadInfo)
						setShareModalVisible(true)
					}}
				>
					<IconShare /> <span>分享话题</span>
				</div>
				<div className={styles.item} onClick={handleRename}>
					<IconEdit className={styles.icon} /> <span>重命名</span>
				</div>
				<div className={styles.item} onClick={handleDelete}>
					<IconTrash className={styles.icon} /> <span>删除话题</span>
				</div>
			</div>
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
			<Popup
				visible={attachmentVisible}
				onMaskClick={() => {
					setAttachmentVisible(false)
				}}
				bodyStyle={{ height: "90%", backgroundColor: "#fff" }}
			>
				<SafeArea position="top" />
				<div className={styles.attachmentList}>
					<AttachmentList
						attachments={attachments}
						setUserSelectDetail={setUserSelectDetail}
					/>
				</div>
				<SafeArea position="bottom" />
			</Popup>
			<MagicModal
				title="话题重命名"
				onCancel={() => {
					setRenameModalVisible(false)
				}}
				onOk={handleRenameConfirm}
				open={renameModalVisible}
			>
				<div style={{ padding: "10px" }}>
					<Input
						placeholder="请输入话题名称"
						value={newTopicName}
						onChange={(val) => setNewTopicName(val)}
						autoFocus
					/>
				</div>
			</MagicModal>
			{/* <Modal
				visible={renameModalVisible}
				bodyStyle={{ backgroundColor: "#fff" }}
				content={
					<div style={{ padding: "10px" }}>
						<Input
							placeholder="请输入话题名称"
							value={newTopicName}
							onChange={(val) => setNewTopicName(val)}
							autoFocus
						/>
					</div>
				}
				getContainer={() => {
					return document.querySelector("body") || document.body
				}}
				closeOnAction
				onClose={() => setRenameModalVisible(false)}
				actions={[
					{
						key: "cancel",
						text: (
							<span style={{ backgroundColor: "#fff", color: "#1677ff" }}>取消</span>
						),
						onClick: () => setRenameModalVisible(false),
					},
					{
						key: "confirm",
						text: (
							<span style={{ backgroundColor: "#1677ff", color: "#fff" }}>确定</span>
						),
						primary: true,
						onClick: handleRenameConfirm,
					},
				]}
			/> */}
			<MagicModal
				title={`删除话题`}
				onCancel={() => {
					setDeleteModalVisible(false)
				}}
				onOk={handleDeleteConfirm}
				open={deleteModalVisible}
				okButtonProps={{ danger: true }}
			>
				{`确定要删除话题：${selectedThreadInfo?.topic_name} 吗？`}
			</MagicModal>
			{/* <Modal
				visible={deleteModalVisible}
				bodyStyle={{ backgroundColor: "#fff" }}
				content={
					<div style={{ padding: "10px" }}>
						<div>确定要删除话题：{selectedThreadInfo?.topic_name} 吗？</div>
					</div>
				}
				getContainer={() => {
					return document.querySelector("body") || document.body
				}}
				closeOnAction
				onClose={() => setDeleteModalVisible(false)}
				actions={[
					{
						key: "cancel",
						text: <span style={{ color: "#1677ff" }}>取消</span>,
						onClick: () => setDeleteModalVisible(false),
					},
					{
						key: "confirm",
						text: <span style={{ color: "#ff4d4f" }}>确定删除</span>,
						danger: true,
						onClick: handleDeleteConfirm,
					},
				]}
			/> */}
		</div>
	)
})
