import { create } from "zustand"
import { immer } from "zustand/middleware/immer"

interface StreamMessageStore {
	/** 内容 */
	contentMap: Record<string, string>
	/** 推理内容 */
	reasoningContentMap: Record<string, string>
	/** 流式消息结束标记 */
	streamEndMap: Record<string, boolean>
	/** 获取内容 */
	getContentMap: (key: string) => string
	/** 获取推理内容 */
	getReasoningContentMap: (key: string) => string
	/** 更新内容 */
	updateContent: (key: string, content: string) => void
	/** 更新推理内容 */
	updateReasoningContent: (key: string, reasoningContent: string) => void
	/**
	 * 标记流式结束
	 * @param key
	 */
	markStreamEnd: (key: string) => void
	/**
	 * 检查流式消息是否结束
	 * @param key
	 */
	isStreamEnd: (key: string) => boolean
}

/**
 * 流式消息存储
 */
export const useStreamMessageStore = create<StreamMessageStore>()(
	immer((set, get) => {
		return {
			contentMap: {},
			reasoningContentMap: {},
			streamEndMap: {},

			/**
			 * 获取内容
			 * @param key
			 * @returns
			 */
			getContentMap: (key: string) =>
				get().isStreamEnd(key) ? "" : get().contentMap[key] ?? "",

			/**
			 * 获取推理内容
			 * @param key
			 * @returns
			 */
			getReasoningContentMap: (key: string) =>
				get().isStreamEnd(key) ? "" : get().reasoningContentMap[key] ?? "",

			/**
			 * 更新内容
			 * @param key
			 * @param content
			 */
			updateContent: (key: string, content: string) => {
				set((state) => {
					if (state.contentMap[key]) {
						state.contentMap[key] += content
					} else {
						state.contentMap[key] = content
					}
				})
			},

			/**
			 * 更新推理内容
			 * @param key
			 * @param reasoningContent
			 */
			updateReasoningContent: (key: string, reasoningContent: string) => {
				set((state) => {
					if (state.reasoningContentMap[key]) {
						state.reasoningContentMap[key] += reasoningContent
					} else {
						state.reasoningContentMap[key] = reasoningContent
					}
				})
			},
			/**
			 * 标记流式结束
			 */
			markStreamEnd(key: string) {
				set((state) => {
					state.streamEndMap[key] = true
				})
			},
			/**
			 * 检查流式消息是否结束
			 */
			isStreamEnd(key: string) {
				return get().streamEndMap[key] || false
			},
		}
	}),
)
