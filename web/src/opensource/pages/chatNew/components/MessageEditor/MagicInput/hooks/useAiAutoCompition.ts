import type { MagicRichEditorRef } from "@/opensource/components/base/MagicRichEditor"
import { Extension } from "@tiptap/core"
import { Plugin } from "@tiptap/pm/state"
import type { Transaction, EditorState } from "@tiptap/pm/state"
import { useMemoizedFn, useDebounceFn } from "ahooks"
import type { RefObject } from "react"
import { useRef, useMemo } from "react"

export interface AIAutoCompletionExtensionOptions {
	fetchSuggestion?: (value: string) => Promise<string>
}

/**
 * 自动补全扩展
 */
const useAIAutoCompletionExtension = (
	editorRef: RefObject<MagicRichEditorRef>,
	aiAutoCompletion?: AIAutoCompletionExtensionOptions,
) => {
	const composition = useRef(false)
	const valueCache = useRef("")
	// 跟踪当前建议词，用于恢复
	const currentSuggestion = useRef("")
	// 标记当前是否正在执行历史操作
	const isHistoryOperation = useRef(false)

	/**
	 * 更新建议词 - 使用编辑器状态但不影响历史
	 */
	const updateSuggestion = useMemoizedFn((suggestion?: string) => {
		const editor = editorRef.current?.editor
		if (!editor) return

		// 保存当前建议词以便恢复
		currentSuggestion.current = suggestion || ""

		// 使用特殊标记的事务更新属性
		// 1. 创建事务并标记为不记录历史
		const { tr } = editor.state
		tr.setMeta("addToHistory", false)
		tr.setMeta("suggestionUpdate", true)

		// 2. 应用事务
		editor.view.dispatch(tr)

		// 3. 通过命令更新属性
		editor.commands.updateAttributes("paragraph", { suggestion: suggestion || "" })
	})

	/**
	 * 触发获取提示词
	 */
	const { run: triggerFetchSuggestion } = useDebounceFn(
		useMemoizedFn(async (v?: string) => {
			if (!v || !aiAutoCompletion || composition.current) return

			valueCache.current = v

			try {
				const suggestion = await aiAutoCompletion?.fetchSuggestion?.(v)
				// 内容不空的时候, 且没有在输入中, 更新提示词
				if (!editorRef.current?.editor?.isEmpty && !composition.current) {
					updateSuggestion(suggestion)
				}
			} catch (e) {
				console.error("Error fetching suggestion:", e)
			}
		}),
		{
			wait: 200,
		},
	)

	/**
	 * 清除提示词
	 */
	const clearSuggestion = useMemoizedFn(() => {
		valueCache.current = ""
		currentSuggestion.current = ""
		updateSuggestion("")
	})

	/**
	 * 开始输入
	 */
	const onCompositionStart = useMemoizedFn(() => {
		composition.current = true
		clearSuggestion()
	})

	/**
	 * 结束输入
	 */
	const onCompositionEnd = useMemoizedFn(() => {
		composition.current = false
		triggerFetchSuggestion(editorRef.current?.editor?.getText())
	})

	/** 自动补全插件 */
	const AIAutoCompletionExtension = useMemo(() => {
		return Extension.create<
			AIAutoCompletionExtensionOptions | undefined,
			{ valueCache: string }
		>({
			name: "ai-auto-completion",

			// 优先级设置为高
			priority: 1000,

			addGlobalAttributes() {
				return [
					{
						types: ["paragraph"],
						attributes: {
							suggestion: {
								default: "",
								parseHTML: (element) => {
									return element.getAttribute("data-suggestion") ?? ""
								},
								renderHTML: (attrs) => {
									return { "data-suggestion": attrs.suggestion }
								},
							},
						},
					},
				]
			},

			// 添加ProseMirror插件处理事务
			addProseMirrorPlugins() {
				return [
					new Plugin({
						// 事务过滤器
						appendTransaction: (
							transactions: readonly Transaction[],
							_: EditorState,
							newState: EditorState,
						) => {
							// 检查是否有历史操作
							const hasHistoryOp = transactions.some(
								(tr) => tr.getMeta("isUndoing") || tr.getMeta("isRedoing"),
							)

							if (hasHistoryOp) {
								// 标记为历史操作，稍后恢复建议词
								isHistoryOperation.current = true

								// 在撤销/重做后，使用异步方式恢复建议词
								setTimeout(() => {
									// 恢复建议词但不参与历史
									if (isHistoryOperation.current && currentSuggestion.current) {
										// 先重新获取编辑器，因为可能已经更新
										const editor = editorRef.current?.editor
										if (editor) {
											// 使用不记录历史的方式恢复建议词
											const { tr } = editor.state
											tr.setMeta("addToHistory", false)
											tr.setMeta("suggestionUpdate", true)
											editor.view.dispatch(tr)

											editor.commands.updateAttributes("paragraph", {
												suggestion: currentSuggestion.current,
											})
										}
										isHistoryOperation.current = false
									}
								}, 0)
							}

							// 检查是否是建议词更新事务
							if (transactions.some((tr) => tr.getMeta("suggestionUpdate"))) {
								// 返回带有标记的事务，确保不影响历史
								return newState.tr.setMeta("addToHistory", false)
							}

							return null
						},
					}),
				]
			},

			// 监控撤销事件
			onTransaction({ transaction }) {
				if (transaction.getMeta("isUndoing") || transaction.getMeta("isRedoing")) {
					isHistoryOperation.current = true
				}
			},

			onSelectionUpdate() {
				const editor = editorRef.current?.editor
				if (!editor) return

				const text = editor.getText()

				// 文本变化，重新获取建议
				if (text && text !== valueCache.current && !composition.current) {
					triggerFetchSuggestion(text)
				}
			},

			onBlur() {
				if (valueCache.current) {
					clearSuggestion()
				}
			},

			// Tab键行为 - 将建议插入到编辑器
			addKeyboardShortcuts() {
				return {
					Tab: ({ editor }) => {
						editor.chain().focus().run()

						// 获取建议词
						const attr = editor.getAttributes("paragraph")
						const { suggestion } = attr

						if (suggestion) {
							const currentPosition = editor.state.selection.head
							// 获取文档末尾位置
							const endPosition = editor.state.doc.content.size - 1
							editor.commands.focus(endPosition)

							// 在文档末尾插入文本（这会被添加到历史中，这是预期行为）
							editor.commands.insertContent(suggestion)

							// 清除建议词（不影响历史）
							updateSuggestion("")

							// 是否在文档末尾
							const isNotLastPosition = currentPosition < endPosition
							// 如果不在文档末尾, 则聚焦到之前光标位置
							if (isNotLastPosition) {
								editor.commands.focus(currentPosition)
							}
						}
						return true
					},
				}
			},
		})
	}, [clearSuggestion, triggerFetchSuggestion, updateSuggestion, editorRef])

	return {
		AIAutoCompletionExtension,
		onCompositionStart,
		onCompositionEnd,
		triggerFetchSuggestion,
		clearSuggestion,
	}
}

export default useAIAutoCompletionExtension
