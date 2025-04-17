import { Flex, message } from "antd"
import { useTranslation } from "react-i18next"
import { IconSend, IconCircleX, IconMessage2Plus } from "@tabler/icons-react"
import MagicButton from "@/opensource/components/base/MagicButton"
import { useMemo, useRef, useState, useEffect } from "react"
import type { HTMLAttributes } from "react"
import { useThrottleFn, useKeyPress, useMemoizedFn, useUpdateEffect } from "ahooks"
import { useUpload } from "@/opensource/hooks/useUploadFiles"
import type { Content, JSONContent, UseEditorOptions } from "@tiptap/react"
import { cloneDeep, omit } from "lodash-es"
import type { ReportFileUploadsResponse } from "@/opensource/apis/modules/file"
import { InstructionGroupType, SystemInstructType } from "@/types/bot"
import MagicEmojiNodeExtension from "@/opensource/components/base/MagicRichEditor/extensions/magicEmoji"
import {
	fileToBase64,
	isOnlyText,
	transformJSONContent,
} from "@/opensource/components/base/MagicRichEditor/utils"
import { Image } from "@/opensource/components/base/MagicRichEditor/extensions/image"
import { observer } from "mobx-react-lite"
import type { MagicRichEditorRef } from "@/opensource/components/base/MagicRichEditor"
import MagicIcon from "@/opensource/components/base/MagicIcon"
import MagicRichEditor from "@/opensource/components/base/MagicRichEditor"
import type { EmojiInfo } from "@/opensource/components/base/MagicEmojiPanel/types"
import { useGlobalLanguage } from "@/opensource/models/config/hooks"
import TopicService from "@/opensource/services/chat/topic/class"
import { IMStyle, useAppearanceStore } from "@/opensource/providers/AppearanceProvider/context"
import ConversationStore from "@/opensource/stores/chatNew/conversation"
import { interfaceStore } from "@/opensource/stores/interface"
import ReplyStore from "@/opensource/stores/chatNew/messageUI/Reply"
import MessageReplyService from "@/opensource/services/chat/message/MessageReplyService"
import EditorDraftService from "@/opensource/services/chat/editor/DraftService"
import EditorDraftStore from "@/opensource/stores/chatNew/editorDraft"
import EditorStore from "@/opensource/stores/chatNew/messageUI/editor"
import { isWindows } from "@/utils/devices"
import { MessageReceiveType } from "@/types/chat"
import ConversationBotDataService from "@/opensource/services/chat/conversation/ConversationBotDataService"
import { autorun } from "mobx"
import type { AIAutoCompletionExtensionOptions } from "./hooks/useAiAutoCompition"
import useAIAutoCompletionExtension from "./hooks/useAiAutoCompition"
import type { FileData } from "./components/InputFiles/types"
import InputFiles from "./components/InputFiles"
import UploadButton from "./components/UploadButton"
import EmojiButton from "./components/EmojiButton"
import { genFileData } from "./components/InputFiles/utils"
import MagicInputLayout from "./components/MagicInputLayout"
import useInputStyles from "./hooks/useInputStyles"
// import useRecordingSummary from "./hooks/useRecordingSummary"
import TimedTaskButton from "./components/TimedTaskButton"
import InstructionActions from "../../quick-instruction"
import QuickInstructionExtension from "../../quick-instruction/extension"
import MessageRefer from "../../ChatMessageList/components/ReferMessage"
import { generateRichText } from "../../ChatSubSider/utils"
import { FileApi } from "@/opensource/apis"

export interface SendData {
	jsonValue: JSONContent | undefined
	normalValue: string
	files: ReportFileUploadsResponse[]
	onlyTextContent: boolean
}

const MAX_UPLOAD_COUNT = 20

export interface MagicInputProps extends Omit<HTMLAttributes<HTMLDivElement>, "defaultValue"> {
	/** 底层编辑器 Tiptap 配置 */
	tiptapProps?: UseEditorOptions
	/** 是否可见 */
	visible?: boolean
	/** 是否禁用 */
	disabled?: boolean
	/** 主题 */
	theme?: IMStyle
	/** 初始值 */
	defaultValue?: Content
	/** 值 */
	value?: Content
	/** 值变化 */
	onChange?: (value?: Content) => void
	/** 发送消息 */
	onSend?: (data: SendData) => void
	/** 回车发送 */
	sendWhenEnter?: boolean
	/** 发送后是否清空 */
	clearAfterSend?: boolean
	/** 占位符 */
	placeholder?: string
	/** 自动补全插件 */
	aiAutoCompletion?: AIAutoCompletionExtensionOptions
	/** 输入框样式 */
	inputMainClassName?: string
}

const ConversationInput = observer(function ConversationInput({
	disabled = false,
	tiptapProps,
	visible = true,
	theme = IMStyle.Standard,
	placeholder,
	onSend: onSendInProps,
	sendWhenEnter = true,
	clearAfterSend = true,
	aiAutoCompletion,
	value,
	defaultValue,
	onChange: onValueChange,
	className,
	inputMainClassName,
	...rest
}: MagicInputProps) {
	const { t } = useTranslation("interface")
	// const { t: messageT } = useTranslation("message")
	const language = useGlobalLanguage(false)
	const { standardStyles, modernStyles } = useInputStyles({ disabled })
	const isAiConversation =
		ConversationStore.currentConversation?.receive_type === MessageReceiveType.Ai
	const conversationId = ConversationStore.currentConversation?.id
	const topicId = ConversationStore.currentConversation?.current_topic_id

	// const isStandard = useMemo(() => theme === IMStyle.Standard, [theme])

	const editorRef = useRef<MagicRichEditorRef>(null)
	const [isEmpty, setIsEmpty] = useState<boolean>(true)

	// 增加内部状态以支持非受控模式
	const [internalValue, setInternalValue] = useState<Content | undefined>(defaultValue)

	// 判断是否为受控组件
	const isControlled = value !== undefined
	// 获取当前值（受控或非受控）
	const currentValue = isControlled ? value : internalValue

	// 检查内容是否为有效的Tiptap JSON格式
	const isValidContent = useMemo(() => {
		if (currentValue === undefined || currentValue === null) return false
		// 简单检查是否有type属性
		if (typeof currentValue === "object" && "type" in currentValue) return true
		return false
	}, [currentValue])

	// 编辑器是否准备好
	const [editorReady, setEditorReady] = useState(false)
	// 防止重复设置内容
	const settingContent = useRef(false)

	const {
		updateProps,
		residencyContent,
		enhanceJsonContentBaseSwitchInstruction,
		clearSessionInstructConfig,
	} = ConversationBotDataService

	useEffect(() => {
		const disposer = autorun(() => {
			if (ConversationStore.selectText && editorReady && !settingContent.current) {
				settingContent.current = true
				editorRef.current?.editor?.commands.setContent(ConversationStore.selectText, true)
				editorRef.current?.editor?.commands.focus()
				ConversationStore.setSelectText("")
				settingContent.current = false
			}
		})
		return () => disposer()
	}, [editorReady])

	useUpdateEffect(() => {
		if (value !== undefined && editorReady && !settingContent.current) {
			settingContent.current = true
			editorRef.current?.editor?.commands.setContent(value, true)
			editorRef.current?.editor?.commands.focus()
			settingContent.current = false
		}
	}, [value, editorReady])

	/** ============================== 引用消息 =============================== */
	const referMessageId = ReplyStore.replyMessageId
	const handleReferMessageClick = useMemoizedFn(() => {
		if (referMessageId) {
			// FIXME: 滚动到引用消息
		}
	})

	/** ============================== 文件上传 =============================== */
	const [files, setFilesRaw] = useState<FileData[]>([])
	const setFiles = useMemoizedFn((l: FileData[] | ((prev: FileData[]) => FileData[])) => {
		const list = typeof l === "function" ? l(files) : l
		setFilesRaw(list.slice(0, MAX_UPLOAD_COUNT))
		if (list.length > MAX_UPLOAD_COUNT) {
			message.error(t("file.uploadLimit", { count: MAX_UPLOAD_COUNT }))
		}
	})
	const { upload, uploading } = useUpload<FileData>({
		storageType: "private",
		onProgress(file, progress) {
			setFiles((l) => {
				const newFiles = [...l]
				const target = newFiles.find((f) => f.id === file.id)
				if (target) target.progress = progress
				return newFiles
			})
		},
		onSuccess(file, response) {
			setFiles((l) => {
				const newFiles = [...l]
				const target = newFiles.find((f) => f.id === file.id)
				if (target) {
					target.status = "done"
					target.result = response
				}
				return newFiles
			})
		},
		onFail(file, error) {
			setFiles((l) => {
				const newFiles = [...l]
				const target = newFiles.find((f) => f.id === file.id)
				if (target) {
					target.status = "error"
					target.error = error
				}
				return newFiles
			})
		},
		onInit(file, { cancel }) {
			setFiles((l) => {
				const newFiles = [...l]
				const target = newFiles.find((f) => f.id === file.id)
				if (target) {
					target.cancel = cancel
				}
				return newFiles
			})
		},
	})

	/** ========================== 发送消息 ========================== */
	const sending = useRef(false)
	const { run: onSend } = useThrottleFn(
		useMemoizedFn(async (jsonValue: JSONContent | undefined, onlyTextContent: boolean) => {
			try {
				if (sending.current) return
				sending.current = true

				// 先上传文件
				const { fullfilled, rejected } = await upload(files)
				if (rejected.length > 0) {
					message.error(t("file.uploadFail", { ns: "message" }))
					sending.current = false
					return
				}

				// 上报文件
				const reportRes =
					fullfilled.length > 0
						? await FileApi.reportFileUploads(
								fullfilled.map((d) => ({
									file_extension: d.value.name.split(".").pop() ?? "",
									file_key: d.value.key,
									file_size: d.value.size,
									file_name: d.value.name,
								})),
						  )
						: []

				// 找到所有的图片,进行上传
				const jsonContentImageTransformed = await transformJSONContent(
					jsonValue,
					(c) => c.type === Image.name,
					async (c) => {
						const src = c.attrs?.src
						if (src) {
							const blob = await fetch(src).then((res) => res.blob())
							const file = new File([blob], c.attrs?.file_name ?? "image", {
								type: blob.type,
							})

							const { fullfilled: f, rejected: r } = await upload([genFileData(file)])

							if (f.length > 0) {
								const file_extension = file.type.split("/").pop() ?? ""
								const res = await FileApi.reportFileUploads([
									{
										file_extension,
										file_key: f[0].value.key,
										file_size: f[0].value.size,
										file_name: f[0].value.name,
									},
								])
								if (c) {
									c.attrs = {
										...(c?.attrs ?? {}),
										src: "",
										file_id: res[0].file_id,
										file_extension,
										file_size: file.size,
										file_name: file.name,
									}
								}
							} else if (r.length > 0) {
								message.error(t("file.uploadFail", { ns: "message" }))
								throw new Error("upload fail")
							}
						}
					},
				)

				const normalValue = generateRichText(JSON.stringify(jsonContentImageTransformed))

				// 发送消息
				onSendInProps?.({
					jsonValue: jsonContentImageTransformed,
					normalValue,
					files: reportRes,
					onlyTextContent,
				})

				if (clearAfterSend) {
					setIsEmpty(true)
					editorRef.current?.editor?.chain().clearContent().run()
					if (residencyContent.length > 0) {
						editorRef.current?.editor
							?.chain()
							.focus()
							.insertContent(cloneDeep(residencyContent))
							.run()
					}

					clearSessionInstructConfig()

					MessageReplyService.reset()
					setFiles([])
					// 清空内部状态
					setInternalValue(undefined)
				}
			} catch (error) {
				console.error("onSend error", error)
			} finally {
				sending.current = false
			}
		}),
		{ wait: 200 },
	)

	updateProps({
		editorRef: editorRef.current,
		onSend,
	})

	/** ========================== 添加表情 ========================== */
	const onAddEmoji = useMemoizedFn((emoji: EmojiInfo) => {
		editorRef.current?.editor
			?.chain()
			.focus()
			.insertContent({
				type: MagicEmojiNodeExtension.name,
				attrs: { ...emoji, locale: language },
			})
			.run()
	})

	/** ========================== 上传文件相关 ========================== */
	const onFileChange = useMemoizedFn(async (fileList: FileList | File[]) => {
		const imageFiles: File[] = []
		const otherFiles: File[] = []

		// 文件先分类: 图片和其他
		for (let i = 0; i < fileList.length; i += 1) {
			if (fileList[i].type.includes("image") && fileList[i].type !== "image/svg+xml") {
				imageFiles.push(fileList[i])
			} else {
				otherFiles.push(fileList[i])
			}
		}

		// 处理图片,插入到输入框
		if (imageFiles.length > 0) {
			const pos = editorRef.current?.editor?.state.selection.$from.pos ?? 0
			await Promise.all(
				imageFiles.map(async (file) => {
					const file_extension = file.type.split("/").pop() ?? ""
					const src = await fileToBase64(file)

					editorRef.current?.editor?.commands.insertContentAt(pos, {
						type: Image.name,
						attrs: {
							src,
							file_name: file.name,
							file_size: file.size,
							file_extension,
						},
					})
				}),
			)
			editorRef.current?.editor?.commands.focus(pos + imageFiles.length)
		}

		// 处理其他文件
		if (otherFiles.length > 0) {
			setFiles((l) => [...l, ...otherFiles.map(genFileData)])
		}
		editorRef.current?.editor?.chain().focus().run()
	})

	const footerInstructionsNode = useMemo(() => {
		if (!isAiConversation) return null
		return <InstructionActions position={InstructionGroupType.DIALOG} />
	}, [isAiConversation])

	const emojiButton = useMemo(
		() => (
			<EmojiButton
				className={standardStyles.button}
				imStyle={theme}
				onEmojiClick={onAddEmoji}
			/>
		),
		[standardStyles.button, theme, onAddEmoji],
	)

	const uploadButton = useMemo(
		() => (
			<UploadButton
				className={standardStyles.button}
				imStyle={theme}
				onFileChange={onFileChange}
				multiple
			/>
		),
		[standardStyles.button, theme, onFileChange],
	)

	const isShowStartPage = interfaceStore.isShowStartPage
	const onCreateTopic = useMemoizedFn(() => {
		if (isShowStartPage) interfaceStore.updateIsShowStartPage(false)
		TopicService.createTopic?.()
	})

	const newTopicButton = useMemo(
		() => (
			<MagicButton
				className={standardStyles.button}
				type="text"
				icon={<MagicIcon size={20} color="currentColor" component={IconMessage2Plus} />}
				onClick={onCreateTopic}
			>
				{t("chat.input.newTopic")}
			</MagicButton>
		),
		[onCreateTopic, standardStyles.button, t],
	)

	// const { startRecordingSummary, RecordingSummaryButton } = useRecordingSummary({
	// 	conversationId,
	// })

	// const onStartRecordingSummary = useMemoizedFn(() => {
	// 	if (isShowStartPage) updateStartPage(false)
	// 	startRecordingSummary()
	// })

	// const recordingSummaryButton = (
	// 	<MagicButton
	// 		className={standardStyles.button}
	// 		type="text"
	// 		icon={RecordingSummaryButton}
	// 		onClick={onStartRecordingSummary}
	// 	>
	// 		{messageT("chat.recording_summary.title")}
	// 	</MagicButton>
	// )

	const recordingSummaryButton = null

	const timedTaskButton = useMemo(
		() => <TimedTaskButton className={standardStyles.button} conversationId={conversationId} />,
		[conversationId, standardStyles.button],
	)

	/** ========================== 按钮组 ========================== */
	const buttons = useMemo(() => {
		if (isAiConversation) {
			return (
				<Flex align="center" justify="space-between">
					<Flex align="center" gap={4} className={standardStyles.buttonGroups}>
						<InstructionActions
							position={InstructionGroupType.TOOL}
							systemButtons={{
								[SystemInstructType.EMOJI]: emojiButton,
								[SystemInstructType.FILE]: uploadButton,
								[SystemInstructType.TOPIC]: newTopicButton,
								[SystemInstructType.TASK]: timedTaskButton,
								[SystemInstructType.RECORD]: recordingSummaryButton,
							}}
						/>
					</Flex>
				</Flex>
			)
		}
		return (
			<Flex align="center" gap={4} className={standardStyles.buttonGroups}>
				{emojiButton}
				{uploadButton}
			</Flex>
		)
	}, [
		isAiConversation,
		standardStyles.buttonGroups,
		emojiButton,
		uploadButton,
		newTopicButton,
		timedTaskButton,
	])

	const referMessage = useMemo(() => {
		if (!referMessageId) return null
		return (
			<Flex
				align="center"
				justify="space-between"
				className={standardStyles.referMessageSection}
			>
				<MessageRefer
					isSelf={false}
					className={standardStyles.referMessage}
					onClick={handleReferMessageClick}
				/>
				<MagicButton
					type="text"
					icon={<MagicIcon size={20} component={IconCircleX} />}
					onClick={MessageReplyService.reset}
				/>
			</Flex>
		)
	}, [
		referMessageId,
		standardStyles.referMessageSection,
		standardStyles.referMessage,
		handleReferMessageClick,
	])

	/** ========================== 草稿 ========================== */

	/** 切换会话或者话题时, 保存和读取草稿 */
	useEffect(() => {
		if (conversationId && editorReady && !settingContent.current) {
			settingContent.current = true
			// 保存草稿
			if (
				EditorStore.lastConversationId !== conversationId ||
				EditorStore.lastTopicId !== topicId
			) {
				EditorDraftService.writeDraft(
					EditorStore.lastConversationId,
					EditorStore.lastTopicId ?? "",
					{
						content: editorRef.current?.editor?.getJSON(),
						files,
					},
				)
			}
			// 读取草稿
			if (EditorDraftStore.hasDraft(conversationId, topicId ?? "")) {
				const draft = EditorDraftStore.getDraft(conversationId, topicId ?? "")
				editorRef.current?.editor?.commands.setContent(draft?.content ?? "", true)
				setFiles(draft?.files ?? [])
			} else {
				editorRef.current?.editor?.chain().clearContent().run()
				setIsEmpty(true)
				setFiles([])
			}

			// 重置内部状态
			setInternalValue(undefined)
			settingContent.current = false
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [conversationId, topicId, setIsEmpty, editorReady])

	/** ========================== AI 自动补全 ========================== */
	const { AIAutoCompletionExtension, onCompositionStart, onCompositionEnd, clearSuggestion } =
		useAIAutoCompletionExtension(editorRef, aiAutoCompletion)

	useEffect(() => {
		if (isEmpty) {
			clearSuggestion()
		}
	}, [isEmpty, clearSuggestion])

	const openAiCompletion = useAppearanceStore((state) => state.aiCompletion)
	/** ========================== 编辑器配置 ========================== */
	const editorProps = useMemo<UseEditorOptions>(() => {
		const extensions = [
			/** 快捷指令 */
			QuickInstructionExtension,
			/** 其他扩展 */
			...(tiptapProps?.extensions ?? []),
		]

		if (openAiCompletion) {
			extensions.unshift(AIAutoCompletionExtension)
		}

		// Tiptap的默认空内容结构（doc with paragraph）
		const emptyTiptapContent = {
			type: "doc",
			content: [{ type: "paragraph" }],
		}

		return {
			// onPaste,
			content: isValidContent ? currentValue : emptyTiptapContent,
			onUpdate: ({ editor: e }) => {
				if (settingContent.current) return

				try {
					// 获取编辑器JSON
					const json = e?.getJSON()
					const text = e?.getText() ?? ""

					// 确保json有效才更新状态
					if (json && typeof json === "object" && "type" in json) {
						// 更新外部状态
						onValueChange?.(json)
						setIsEmpty(!text)

						// 更新内部状态（非受控模式）
						if (!isControlled) {
							setInternalValue(json)
						}
					}
				} catch (error) {
					console.error("Error updating editor content:", error)
				}
			},
			onTransaction: () => {
				// 处理输入事件，不触发重渲染
			},
			onCreate: () => {
				setEditorReady(true)
			},
			extensions,
			enableContentCheck: false, // 关闭内置内容检查，我们自己处理
			...omit(tiptapProps, ["extensions", "onContentError"]),
		}
	}, [
		AIAutoCompletionExtension,
		tiptapProps,
		onValueChange,
		currentValue,
		openAiCompletion,
		isControlled,
		isValidContent,
	])

	const getEditorJSON = useMemoizedFn(() => {
		try {
			const editorJson = editorRef.current?.editor?.getJSON()
			// 确保json有效
			if (!editorJson || typeof editorJson !== "object" || !("type" in editorJson)) {
				return {
					json: {
						type: "doc",
						content: [{ type: "paragraph" }],
					},
					onlyText: true,
				}
			}

			const json = enhanceJsonContentBaseSwitchInstruction(editorJson)
			return { json, onlyText: isOnlyText(json) }
		} catch (error) {
			console.error("Error getting editor JSON:", error)
			return {
				json: {
					type: "doc",
					content: [{ type: "paragraph" }],
				},
				onlyText: true,
			}
		}
	})

	/** ========================== 发送按钮 ========================== */
	const sendDisabled = (isEmpty && !files.length) || uploading

	const handleSend = useMemoizedFn(async () => {
		if (!sendDisabled) {
			const { json, onlyText } = getEditorJSON()
			await onSend?.(json, onlyText)
		}
	})

	/** ========================== 回车发送 ========================== */
	useKeyPress(
		"Enter",
		() => {
			console.log("press key enter =======> ")
			if (sendWhenEnter) {
				handleSend()
			}
		},
		{
			exactMatch: true,
		},
	)

	const Footer = useMemo(
		() => (
			<Flex align="center" justify="flex-end" gap={10}>
				<Flex flex={1} align="center" justify="flex-start">
					{footerInstructionsNode}
				</Flex>
				<span className={standardStyles.tip}>
					{isWindows ? t("placeholder.magicInputWindows") : t("placeholder.magicInput")}
				</span>
				<MagicButton
					type="primary"
					size="large"
					disabled={sendDisabled}
					className={modernStyles.sendButton}
					icon={<MagicIcon color="currentColor" component={IconSend} />}
					onClick={handleSend}
				>
					{t("send")}
				</MagicButton>
			</Flex>
		),
		[
			footerInstructionsNode,
			handleSend,
			modernStyles.sendButton,
			sendDisabled,
			standardStyles.tip,
			t,
		],
	)

	const onClick = useMemoizedFn(() => editorRef.current?.editor?.chain().focus().run())

	const ChildrenRender = useMemoizedFn(({ className: inputClassName }) => {
		return (
			<MagicRichEditor
				ref={editorRef}
				placeholder={placeholder}
				className={inputClassName}
				showToolBar={false}
				onClick={onClick}
				onCompositionStart={onCompositionStart}
				onCompositionEnd={onCompositionEnd}
				editorProps={editorProps}
				enterBreak={sendWhenEnter}
			/>
		)
	})

	const onDrop = useMemoizedFn((e) => {
		e.stopPropagation()
		e.preventDefault()
		onFileChange(e.dataTransfer.files)
	})

	const onDragOver = useMemoizedFn((e) => {
		e.stopPropagation()
		e.preventDefault()
	})

	if (!visible) return null

	return (
		<MagicInputLayout
			theme={theme}
			extra={referMessage}
			buttons={
				<>
					{buttons}
					<InputFiles files={files} onFilesChange={setFiles} />
				</>
			}
			footer={Footer}
			className={className}
			inputMainClassName={inputMainClassName}
			onDrop={onDrop}
			onDragOver={onDragOver}
			{...omit(rest, ["onContentChange"])}
		>
			{ChildrenRender}
		</MagicInputLayout>
	)
})

export default ConversationInput
