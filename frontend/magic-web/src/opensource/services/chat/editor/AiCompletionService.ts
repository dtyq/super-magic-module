import { MagicRichEditorRef } from "@/opensource/components/base/MagicRichEditor"
import { debounce } from "lodash-es"
import { Extension } from "@tiptap/core"
import { Plugin } from "@tiptap/pm/state"
import type { Transaction, EditorState } from "@tiptap/pm/state"
import EditorService from "./EditorService"
import AiCompletionTip from "@/opensource/stores/chatNew/editor/AiCompletionTip"
import { platformKey } from "@/utils/storage"
import { userStore } from "@/opensource/models/user"

/**
 * AI自动补全扩展选项接口
 */
export interface AIAutoCompletionExtensionOptions {
	/**
	 * 获取建议词的函数，接收当前文本，返回建议
	 */
	fetchSuggestion?: (value: string) => Promise<string>
}

/**
 * AI自动补全服务
 * 负责管理编辑器中的AI补全功能，包括显示、隐藏建议词和处理用户交互
 *
 * 主要工作流程：
 * 1. 用户输入 -> onUpdate 触发 -> triggerFetchSuggestion 获取建议
 * 2. 获取建议成功 -> updateSuggestion 更新UI -> 用户可按Tab接受建议
 * 3. 用户按Tab -> 调用 editor.commands.insertContent 插入建议 -> clearSuggestion 清除建议词理
 */
class AiCompletionService {
	/** 编辑器实例引用 */
	instance: MagicRichEditorRef | null = null

	/** 是否正在进行输入法组合输入（如中文输入） */
	composition: boolean = false

	/** 当前文本内容的缓存，用于比较变化 */
	valueCache: string = ""

	/** 当前的建议词 */
	currentSuggestion: string = ""

	/** 标记是否在执行撤销/重做等历史操作 */
	isHistoryOperation: boolean = false

	/** AI自动补全配置选项 */
	aiAutoCompletionOptions: AIAutoCompletionExtensionOptions | undefined

	/** 标记是否正在执行清理操作，避免清理过程中触发其他操作 */
	isClear: boolean = false

	/**
	 * 构造函数
	 * @param aiAutoCompletionOptions AI自动补全配置选项
	 */
	constructor(aiAutoCompletionOptions?: AIAutoCompletionExtensionOptions) {
		this.instance = null
		this.aiAutoCompletionOptions = aiAutoCompletionOptions
	}

	/**
	 * 获取本地存储的键名
	 */
	get localStorageKey() {
		const userId = userStore.user.userInfo?.user_id
		return platformKey(`ai-completion-tab-count/${userId}`)
	}

	/**
	 * 获取Tab键点击次数
	 */
	getTabCount() {
		const tabCount = localStorage.getItem(this.localStorageKey)
		return tabCount ? parseInt(tabCount) : 0
	}

	/**
	 * 增加Tab键点击次数
	 */
	addTabCount() {
		const tabCount = this.getTabCount()
		localStorage.setItem(this.localStorageKey, (tabCount + 1).toString())
	}

	/**
	 * 设置编辑器实例
	 * 在组件挂载时调用此方法
	 * @param instance 富文本编辑器实例
	 */
	setInstance = (instance: MagicRichEditorRef) => {
		this.instance = instance
	}

	/**
	 * 判断文本是否为空
	 * 被 updateSuggestion 调用，用于决定是否显示提示
	 * @param suggestion 要检查的文本
	 * @returns 是否为空（null、undefined、空字符串、只包含空白或特殊字符）
	 */
	isEmptyText = (suggestion?: string) => {
		// 处理null、undefined、空字符串情况
		if (!suggestion) return true

		// 处理只包含空白字符的情况
		const trimmed = suggestion.trim()
		if (trimmed.length === 0) return true

		// 检查是否只包含不可见字符或特殊字符
		// 通过将所有不可打印字符一个个替换掉，看是否有可见内容
		let visible = trimmed

		// 删除空格和制表符
		visible = visible.replace(/\s+/g, "")

		// 删除常见的零宽字符（一个个单独替换）
		visible = visible.replace(/\u200B/g, "") // 零宽空格
		visible = visible.replace(/\u200C/g, "") // 零宽非连接符
		visible = visible.replace(/\u200D/g, "") // 零宽连接符
		visible = visible.replace(/\uFEFF/g, "") // 零宽不换行空格
		visible = visible.replace(/\u200E/g, "") // 零宽非断字空格

		visible = visible.replace(/\uFE0F/g, "")

		// 最终检查是否为空
		return visible.length === 0
	}

	/**
	 * 更新建议词并显示提示
	 * 由 triggerFetchSuggestion 在获取新建议后调用
	 * 也被 clearSuggestion 调用来清除建议
	 * @param suggestion 建议词
	 */
	updateSuggestion = (suggestion?: string) => {
		const editor = this.instance?.editor
		if (!editor) return

		const isEmpty = this.isEmptyText(suggestion)
		// 如果建议为空，隐藏提示并清除属性
		if (isEmpty) {
			// 清除段落属性中的建议词
			editor.commands.updateAttributes("paragraph", { suggestion: "" })
			AiCompletionTip.hide()
			return
		}

		// 保存当前建议词以便恢复
		this.currentSuggestion = suggestion || ""

		// 创建特殊标记的事务，确保不影响历史记录
		const { tr } = editor.state
		tr.setMeta("addToHistory", false)
		tr.setMeta("suggestionUpdate", true)
		editor.view.dispatch(tr)

		// 更新段落属性，添加建议词
		editor.commands.updateAttributes("paragraph", { suggestion: suggestion || "" })

		// 获取文档末尾位置，用于显示提示
		const endPosition = this.getDocumentEndPosition()

		// 如果有位置信息且建议不为空，显示提示
		if (endPosition && !isEmpty) {
			// 如果Tab键点击次数小于2次，则显示提示
			if (this.getTabCount() < 2) {
				AiCompletionTip.show({
					left: endPosition.left,
					top: endPosition.top + endPosition.height,
				})
			}
		} else if (isEmpty) {
			AiCompletionTip.hide()
		}
	}

	/**
	 * 获取文档末尾的视图坐标位置
	 * 被 updateSuggestion 调用，用于定位提示框
	 * @returns 文档末尾位置的DOMRect，包含坐标和尺寸信息
	 */
	getDocumentEndPosition = () => {
		const editor = this.instance?.editor
		if (!editor) return

		// 保存当前光标位置
		const currentCursorPosition = editor.state.selection.head
		// 获取文档末尾位置
		const lastPosition = editor.state.doc.content.size - 1

		// 先将光标移到末尾，获取位置信息
		editor.commands.focus(lastPosition, { scrollIntoView: false })
		const endPosition = this.getCurrentCursorPosition()

		// 恢复光标位置
		editor.commands.focus(currentCursorPosition, { scrollIntoView: false })

		return endPosition
	}

	/**
	 * 获取当前光标的视图坐标位置
	 * 被 getDocumentEndPosition 调用
	 * @returns 当前光标的DOMRect，包含坐标和尺寸信息
	 */
	getCurrentCursorPosition = () => {
		const selection = window.getSelection()
		if (!selection || selection.rangeCount === 0) {
			return
		}

		const range = selection.getRangeAt(0)
		return range.getBoundingClientRect()
	}

	/**
	 * 触发获取AI建议词（带防抖）
	 * 由编辑器的 onUpdate 事件触发，当内容变化时调用
	 * 防抖处理避免频繁请求
	 */
	triggerFetchSuggestion = debounce(
		() => {
			const text = this.getText()

			// 检查条件：有文本内容、配置了获取函数、不在输入法组合状态
			if (!text || !this.aiAutoCompletionOptions || this.composition) return

			// 发起请求获取建议词
			this.aiAutoCompletionOptions
				?.fetchSuggestion?.(text)
				.then((suggestion) => {
					// 只有满足以下条件才更新建议词：
					// 1. 编辑器不为空
					// 2. 不在输入法组合状态
					// 3. 当前文本内容没有变化（用户没有继续输入）
					if (
						!this.instance?.editor?.isEmpty &&
						!this.composition &&
						this.getText() === text
					) {
						this.updateSuggestion(suggestion)
						this.valueCache = text
					}
				})
				.catch((e) => {
					console.error("获取AI建议词失败:", e)
				})
		},
		200,
		{
			trailing: true,
		},
	)

	/**
	 * 获取编辑器扩展
	 * 在初始化编辑器时调用，添加AI补全相关的功能
	 * @returns 用于TipTap编辑器的扩展
	 */
	getExtension = () => {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const self = this

		return Extension.create<
			AIAutoCompletionExtensionOptions | undefined,
			{ valueCache: string }
		>({
			name: "ai-auto-completion",

			// 设置高优先级，确保在其他扩展之前处理
			priority: 1000,

			// 添加全局属性，用于存储建议词
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

			// 添加ProseMirror插件，处理事务和状态更新
			addProseMirrorPlugins() {
				return [
					new Plugin({
						// 处理事务并维护历史记录状态
						appendTransaction: (
							transactions: readonly Transaction[],
							_: EditorState,
							newState: EditorState,
						) => {
							// 检查是否有历史操作（撤销/重做）
							const hasHistoryOp = transactions.some(
								(tr) => tr.getMeta("isUndoing") || tr.getMeta("isRedoing"),
							)

							if (hasHistoryOp) {
								// 标记为历史操作，稍后恢复建议词
								self.isHistoryOperation = true

								// 在撤销/重做后，使用异步方式恢复建议词
								setTimeout(() => {
									// 恢复建议词但不参与历史
									if (self.isHistoryOperation && self.currentSuggestion) {
										const editor = self.instance?.editor
										if (editor) {
											// 使用不记录历史的方式恢复建议词
											const { tr } = editor.state
											tr.setMeta("addToHistory", false)
											tr.setMeta("suggestionUpdate", true)
											editor.view.dispatch(tr)

											editor.commands.updateAttributes("paragraph", {
												suggestion: self.currentSuggestion,
											})
										}
										self.isHistoryOperation = false
									}
								}, 0)
							}

							// 检查是否是建议词更新事务，确保这类事务不影响历史
							if (transactions.some((tr) => tr.getMeta("suggestionUpdate"))) {
								return newState.tr.setMeta("addToHistory", false)
							}

							return null
						},
					}),
				]
			},

			// 监控事务，标记历史操作
			onTransaction({ transaction }) {
				if (transaction.getMeta("isUndoing") || transaction.getMeta("isRedoing")) {
					self.isHistoryOperation = true
				}
			},

			/**
			 * 监控编辑器内容更新，触发获取建议
			 * 当用户输入内容时自动触发
			 */
			onUpdate() {
				// 如果正在执行清理操作，跳过处理
				if (self.isClear) {
					self.isClear = false
					return
				}

				const editor = self.instance?.editor
				if (!editor) return

				const text = self.getText()

				// 只有满足以下条件才触发获取建议：
				// 1. 有文本内容
				// 2. 文本内容发生变化
				// 3. 不在输入法组合状态
				if (text && text !== self.valueCache && !self.composition) {
					self.triggerFetchSuggestion()
				}
			},

			// 编辑器失焦时，清除建议
			onBlur() {
				if (self.valueCache) {
					self.clearSuggestion()
				}
			},

			// 添加键盘快捷键处理，Tab键接受建议
			addKeyboardShortcuts() {
				return {
					Tab: ({ editor }) => {
						// 获取建议词
						const attr = editor.getAttributes("paragraph")
						const { suggestion } = attr

						// 加强检查，确保建议词有效
						// 只有在有有效建议词的情况下才执行操作
						if (
							suggestion &&
							typeof suggestion === "string" &&
							suggestion.trim().length > 0
						) {
							editor.chain().focus().run()

							const currentPosition = editor.state.selection.head
							// 获取文档末尾位置
							const endPosition = editor.state.doc.content.size - 1
							editor.commands.focus(endPosition)

							// 在文档末尾插入建议文本
							editor.commands.insertContent(suggestion)

							// 增加Tab键点击次数
							self.addTabCount()

							// 检查光标是否需要恢复
							const isNotLastPosition = currentPosition < endPosition
							if (isNotLastPosition) {
								editor.commands.focus(currentPosition)
							}

							// 插入后清除建议
							self.clearSuggestion()
						}

						// 禁用Tab键默认行为
						return true
					},
				}
			},
		})
	}

	/**
	 * 获取编辑器当前文本内容
	 * 被多个函数调用，用于获取当前编辑器内容
	 * @returns 文本内容
	 */
	getText = () => {
		return this.instance?.editor?.getText()
	}

	/**
	 * 清除建议词和相关状态
	 * 在接受建议、取消建议或编辑器失焦时调用
	 */
	clearSuggestion = () => {
		this.isClear = true
		this.valueCache = ""
		this.currentSuggestion = ""

		// 确保编辑器存在
		const editor = this.instance?.editor
		if (editor) {
			// 直接清除段落属性中的建议词，确保Tab处理程序不会响应
			editor.commands.updateAttributes("paragraph", { suggestion: "" })
		}

		// 隐藏提示，不再通过updateSuggestion间接调用
		AiCompletionTip.hide()
	}

	/**
	 * 处理输入法组合开始事件（如中文输入）
	 * 当用户开始使用输入法输入时触发
	 */
	onCompositionStart = () => {
		this.composition = true
		this.clearSuggestion()
	}

	/**
	 * 处理输入法组合结束事件
	 * 当用户完成输入法输入时触发，重新开始获取建议
	 */
	onCompositionEnd = () => {
		this.composition = false
		this.triggerFetchSuggestion()
	}
}

// 导出单例实例
export default new AiCompletionService({
	fetchSuggestion: EditorService.fetchAiAutoCompletion,
})
