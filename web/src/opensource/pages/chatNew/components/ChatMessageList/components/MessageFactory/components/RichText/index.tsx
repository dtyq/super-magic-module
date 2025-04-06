import { memo, useEffect, useRef, useMemo } from "react"
import { EditorView } from "prosemirror-view"
import { Schema, Node } from "prosemirror-model"
import { EditorState } from "prosemirror-state"
import ChatFileService from "@/opensource/services/chat/file/ChatFileService"
import useStyles from "./styles"
import schemaConfig from "./schemaConfig"
import { transformJSONContent } from "./utils"

interface Props {
	content?: Record<string, any>
	messageId?: string
	className?: string
	hiddenDetail?: boolean
	emojiSize?: number
}

const RichText = memo(
	function RichText(props: Props) {
		const { content, messageId, className, hiddenDetail = false, emojiSize } = props
		const containerRef = useRef<HTMLDivElement>(null)
		const editorViewRef = useRef<EditorView | null>(null)
		const initializingRef = useRef(false)
		const { styles, cx } = useStyles({ emojiSize: emojiSize ?? (hiddenDetail ? 16 : 20) })

		const finalSchema = useMemo(() => new Schema(schemaConfig as any), [])

		// 初始化渲染器
		useEffect(() => {
			if (!containerRef.current || !content || initializingRef.current) return

			async function init() {
				initializingRef.current = true
				try {
					// 处理图片数据
					await transformJSONContent(
						content,
						(c) => c.type === "image",
						async (c) => {
							const src = c.attrs?.src
							if (src) return

							const fileUrl = await ChatFileService.fetchFileUrl([
								{ file_id: c.attrs?.file_id, message_id: messageId ?? "" },
							])
							c.attrs = {
								...c.attrs,
								src: fileUrl[c.attrs?.file_id].url ?? "",
								hidden_detail: hiddenDetail,
							}
						},
					)

					// 处理快捷指令
					transformJSONContent(
						content,
						(c) => c.type === "quick-instruction",
						(c) => {
							c.attrs = {
								...c.attrs,
								hidden_detail: hiddenDetail,
							}
						},
					)

					console.log("content update 1=====> ", content)
					// 处理图片
					editorViewRef.current = new EditorView(containerRef.current, {
						state: EditorState.create({
							doc: Node.fromJSON(finalSchema, content),
							schema: finalSchema,
						}),
						editable: () => false,
						plugins: [],
					})
				} finally {
					initializingRef.current = false
				}
			}

			init()

			// eslint-disable-next-line consistent-return
			return () => {
				editorViewRef.current?.destroy()
			}
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [])

		// // 内容更新处理
		// useEffect(() => {
		// 	if (!editorViewRef.current || !content) return
		// 	console.log("content update 2=====> ", content)
		// 	try {
		// 		// 创建新的 EditorState 而不是尝试部分更新，避免类型不匹配问题
		// 		const newState = EditorState.create({
		// 			doc: Node.fromJSON(finalSchema, content),
		// 			schema: finalSchema,
		// 		})
		// 		editorViewRef.current.updateState(newState)
		// 	} catch (error) {
		// 		console.error("RichText updateState error:", error, content)
		// 	}
		// }, [content, finalSchema])

		return (
			<div
				ref={containerRef}
				id={`message_copy_${messageId}`}
				className={cx(
					styles.container,
					styles.emoji,
					className,
					styles.quickInstruction,
					styles.image,
				)}
			/>
		)
	},
	(prev, next) => {
		return prev.content === next.content && prev.messageId === next.messageId
	},
)

export default RichText
