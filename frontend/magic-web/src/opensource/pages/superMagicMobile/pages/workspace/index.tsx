import { ChatApi } from "@/apis"
import { useUpload } from "@/opensource/hooks/useUploadFiles"
import type { FileData } from "@/opensource/pages/chatNew/components/MessageEditor/MagicInput/components/InputFiles/types"
import { genFileData } from "@/opensource/pages/chatNew/components/MessageEditor/MagicInput/components/InputFiles/utils"
import { generateSnowFlake } from "@/opensource/pages/flow/utils/helpers"
import { userStore } from "@/opensource/models/user"
import { observer } from "mobx-react-lite"
import type { FileItem, Thread, Workspace } from "@/opensource/pages/superMagic/pages/Workspace/types"
import {
	editThread,
	editWorkspace,
	getTopicsByWorkspaceId,
	getWorkspaces,
} from "@/opensource/pages/superMagic/utils/api"
import AccountActions from "@/opensource/pages/superMagicMobile/components/AccountActions"
import PreviewDetailPopup from "@/opensource/pages/superMagicMobile/components/PreviewDetailPopup/index"
import { EventType } from "@/types/chat"
import type { ConversationMessageSend } from "@/types/chat/conversation_message"
import { ConversationMessageType } from "@/types/chat/conversation_message"
import { Popup, SafeArea } from "antd-mobile"
import { message } from "antd"
import { cx } from "antd-style"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { SuperMagicMobileLayoutRef } from "../../components/Layout"
import SuperMagicMobileLayout from "../../components/Layout"
import type { MessagePanelProps } from "../../components/MessagePanel"
import type { PreviewDetailPopupRef } from "../../components/PreviewDetailPopup"
import SwitchRoute from "../../components/SwitchRoute"
import TopicMenu from "../../components/TopicMenu"
import WorkspaceChat from "../../components/WorkspaceChat"
import type { WorkspaceSelectRef } from "../../components/WorkspaceSelect"
import WorkspaceSelect from "../../components/WorkspaceSelect"
import WorkspaceWelcome from "../../components/WorkspaceWelcome"
import { isInApp } from "@/opensource/pages/superMagicMobile/utils/mobile"
import AppMenu from "../../components/AppMenu"
import { useStyles } from "./styles"
import { isEmpty } from "lodash-es"

export default observer(function SuperMagicMobileWorkspace({
	workspaces,
	selectedWorkspace,
	setWorkspaces,
	selectedThreadInfo,
	setFileList,
	fileList,
	setSelectedThreadInfo,
	handleSendMessage,
	handlePullMoreMessage,
	taskData,
	messages,
	showLoading,
	isEmptyStatus,
	attachments,
	fetchWorkspaces,
	setSelectedWorkspace,
}: any) {
	const { styles } = useStyles()
	const { userInfo } = userStore.user
	const layoutRef = useRef<SuperMagicMobileLayoutRef>(null)
	const workspaceSelectRef = useRef<WorkspaceSelectRef>(null)
	const previewDetailPopupRef = useRef<PreviewDetailPopupRef>(null)
	const [popupVisible, setPopupVisible] = useState(false)
	const [autoDetail, setAutoDetail] = useState<any>(null)
	// const pageTokenMap = useRef<Record<string, any>>({})

	const { upload, reportFiles } = useUpload<FileData>({
		storageType: "private",
	})

	const showChat = useMemo(() => {
		return messages.length > 0
	}, [messages])

	const handleSwitchOrganization = () => {
		console.log("Switch organization clicked")
		// Add organization switching logic here
		setPopupVisible(false)
		setWorkspaces([])
		fetchWorkspaces?.()
	}

	const handleLogout = () => {
		console.log("Logout clicked")
		// Add logout logic here
		setPopupVisible(false)
	}

	const messagePanelProps: MessagePanelProps = {
		taskData: taskData || undefined,
		fileList,
		onFileListChange: (files: FileItem[]) => {
			setFileList(files)
		},
		onFilesSelect: async (files: FileList) => {
			const loadingMessage = message.loading("上传中...", 0)
			try {
				const newFiles = Array.from(files).map(genFileData)
				const { fullfilled } = await upload(newFiles)
				if (fullfilled.length !== newFiles.length) {
					message.error("上传失败")
					return
				}
				const data = fullfilled.map(({ value }) => ({
					file_key: value.key,
					file_name: value.name,
					file_size: value.size,
					file_extension: value?.name?.split(".").pop(),
				}))
				const res = await reportFiles(data)
				setFileList?.((e: any) => [...e, ...res])
			} catch (error) {
				console.error(error)
				message.error(error instanceof Error ? error.message : "上传失败")
			} finally {
				loadingMessage()
			}
		},
		onSubmit: handleSendMessage,
		handlePullMoreMessage,
		selectedThreadInfo,
		onStopClick: () => {
			console.log("打断按钮被点击")
			const date = new Date().getTime()
			const newMessage = {
				message_id: generateSnowFlake(),
				content: "终止任务",
				send_timestamp: new Date().toISOString(),
				type: "chat",
				attachments: [],
			}
			if (!selectedWorkspace) return
			ChatApi.chat(
				EventType.Chat,
				{
					message: {
						type: ConversationMessageType.Text,
						text: {
							content: "终止任务",
							instructs: [{ value: "interrupt" }],
							attachments: [],
						},
						send_timestamp: date,
						send_time: date,
						sender_id: userInfo?.user_id,
						app_message_id: newMessage.message_id,
						message_id: newMessage.message_id,
						topic_id: selectedThreadInfo.chat_topic_id,
					} as unknown as ConversationMessageSend["message"],
					conversation_id: selectedWorkspace.conversation_id,
				},
				0,
			)
		},
		showLoading,
		dataLength: messages.length,
		isEmptyStatus,
	}

	// 新增话题
	const onAddTopicButtonClick = async (workspace: string) => {
		const loadingMessage = message.loading("处理中...", 0)
		try {
			const res = await editThread({
				topic_name: "新话题",
				workspace_id: workspace,
			})
			const topicsResponse = (await getTopicsByWorkspaceId({
				id: workspace,
				page: 1,
				page_size: 999,
			})) as { list: Thread[] }
			console.log(topicsResponse, "topicsResponsetopicsResponse")
			const newTopic = topicsResponse?.list.find((topic) => topic?.id === res?.id)
			console.log(newTopic, "newTopicnewTopicnewTopic")
			if (setSelectedThreadInfo && newTopic) {
				setSelectedThreadInfo(newTopic)
			}
			setWorkspaces(
				workspaces.map((workspaceItem: any) => {
					if (workspaceItem.id === workspace) {
						return {
							...workspaceItem,
							topics: topicsResponse.list,
						}
					}
					return workspaceItem
				}),
			)
		} catch (error) {
			console.error(error)
		} finally {
			loadingMessage()
		}
	}

	// 新增工作区
	const onAddWorkspaceButtonClick = async () => {
		const loadingMessage = message.loading("处理中...", 0)
		try {
			await editWorkspace({ workspace_name: "新建工作区" })
			const response = (await getWorkspaces()) as { list: Workspace[] }
			setWorkspaces(response.list)
		} catch (error) {
			console.error(error)
		} finally {
			loadingMessage()
		}
	}
	const openMenu = () => {
		setPopupVisible(true)
		console.log("openMenu")
	}

	const updateDetail = useCallback(
		({ latestMessageDetail, isLoading }: { latestMessageDetail: any; isLoading: boolean }) => {
			if (isEmpty(latestMessageDetail)) {
				setAutoDetail({
					type: "empty",
					data: {
						text: isLoading ? "正在思考" : "完成任务",
					},
				})
			} else {
				setAutoDetail(latestMessageDetail)
			}
		},
		[autoDetail],
	)

	useEffect(() => {
		if (messages.length > 1) {
			const lastDetailMessage = messages
				.slice()
				.reverse()
				.find((message: any) => !isEmpty(message?.tool?.detail))

			updateDetail({
				latestMessageDetail: lastDetailMessage?.tool?.detail,
				isLoading: showLoading,
			})
		}
	}, [messages])
	return (
		<>
			<SafeArea position="top" />
			<SuperMagicMobileLayout
				ref={layoutRef}
				// navigateItems={navigateItems}
				headerCenter={
					<WorkspaceSelect
						ref={workspaceSelectRef}
						workspaces={workspaces}
						selectedWorkspace={selectedWorkspace || undefined}
						selectedTopic={selectedThreadInfo}
						setSelectedThreadInfo={setSelectedThreadInfo}
						onAddTopicButtonClick={onAddTopicButtonClick}
						onAddWorkspaceButtonClick={onAddWorkspaceButtonClick}
						setSelectedWorkspace={setSelectedWorkspace}
					/>
				}
				openMenu={openMenu}
			>
				<div className={cx(styles.container, showChat && styles.chatMode)}>
					{showChat ? (
						<WorkspaceChat
							{...messagePanelProps}
							data={messages}
							dataLength={messages.length}
							showLoading={showLoading}
							isEmptyStatus={isEmptyStatus}
							setFileList={setFileList}
							onSelectDetail={(detail) => {
								console.log(
									detail,
									"detaildetaildetail",
									previewDetailPopupRef.current,
								)
								previewDetailPopupRef.current?.open(detail)
							}}
						/>
					) : (
						<WorkspaceWelcome {...messagePanelProps} setFileList={setFileList} />
					)}
				</div>
			</SuperMagicMobileLayout>
			<PreviewDetailPopup
				ref={previewDetailPopupRef}
				setUserSelectDetail={(detail: any) => {
					console.log(detail, "detaildetaildetail", previewDetailPopupRef.current)
					previewDetailPopupRef.current?.open(detail)
				}}
				onClose={() => {
					previewDetailPopupRef.current?.open({
						...autoDetail,
					})
				}}
			/>
			<Popup
				visible={popupVisible}
				onMaskClick={() => {
					setPopupVisible(false)
				}}
				position="right"
				bodyStyle={{
					width: "80vw",
					padding: "20px",
					backgroundColor: "#fff",
					display: "flex",
					flexDirection: "column",
					justifyContent: "space-between",
				}}
			>
				<div>
					<SafeArea position="top" />
					<SwitchRoute />
					<TopicMenu
						selectedThreadInfo={selectedThreadInfo}
						attachments={attachments}
						setUserSelectDetail={(detail: any) => {
							console.log(detail, "detaildetaildetail", previewDetailPopupRef.current)
							previewDetailPopupRef.current?.open(detail)
						}}
						selectedWorkspace={selectedWorkspace}
						fetchWorkspaces={fetchWorkspaces}
						setSelectedThreadInfo={setSelectedThreadInfo}
						workspaces={workspaces}
						setWorkspaces={setWorkspaces}
					/>
					<div>{isInApp() ? <AppMenu /> : null}</div>
				</div>
				<div>
					<AccountActions
						onSwitchOrganization={handleSwitchOrganization}
						onLogout={handleLogout}
					/>
					<SafeArea position="bottom" />
				</div>
			</Popup>
			<SafeArea position="bottom" />
		</>
	)
})
