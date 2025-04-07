/* eslint-disable class-methods-use-this */
import { useStreamMessageStore } from "@/opensource/stores/stream-message"
import type { StreamResponse, SeqResponse } from "@/types/request"
import { StreamStatus } from "@/types/request"
import type {
	AggregateAISearchCardConversationMessage,
	ConversationMessage,
	MarkdownConversationMessage,
	TextConversationMessage,
} from "@/types/chat/conversation_message"
import { ConversationMessageType } from "@/types/chat/conversation_message"
import Logger from "@/utils/log/Logger"
import { isUndefined } from "lodash-es"
import AiSearchApplyService from "../ChatMessageApplyServices/AiSearchApplyService"
import MessageService from "../../MessageService"
import type { StreamMessageTask } from "./types"
import { sliceMessage } from "./utils"

const console = new Logger("StreamMessageApplyService", "blue", { console: false })

/**
 * 流式消息管理器
 *
 * @class StreamMessageApplyService
 */
class StreamMessageApplyService {
	taskMap: Record<string, StreamMessageTask>

	messageConversationMap: Record<
		string,
		{
			conversationId: string
			topicId: string
			messageId: string
			type: ConversationMessageType
		}
	> = {}

	constructor() {
		this.taskMap = {}
	}

	/**
	 * 记录消息信息
	 * @param message 消息
	 */
	recordMessageInfo(
		message:
			| SeqResponse<ConversationMessage>
			| SeqResponse<AggregateAISearchCardConversationMessage<true>>,
	) {
		switch (message.message.type) {
			case ConversationMessageType.Text:
				this.messageConversationMap[message.message_id] = {
					conversationId: message.conversation_id,
					topicId: message.message.topic_id ?? "",
					messageId: message.message_id,
					type: message.message.type,
				}
				break
			case ConversationMessageType.Markdown:
				this.messageConversationMap[message.message_id] = {
					conversationId: message.conversation_id,
					topicId: message.message.topic_id ?? "",
					messageId: message.message_id,
					type: message.message.type,
				}
				break
			case ConversationMessageType.AggregateAISearchCard:
				this.messageConversationMap[message.message.app_message_id] = {
					conversationId: message.conversation_id,
					topicId: message.message.topic_id ?? "",
					messageId: message.message_id,
					type: message.message.type,
				}
				break
			default:
				break
		}
	}

	/**
	 * 查询消息信息
	 * @param messageId 消息ID
	 * @returns 消息信息
	 */
	queryMessageInfo(messageId: string) {
		return this.messageConversationMap[messageId]
	}

	/**
	 * 添加任务
	 * @param messageId 消息ID
	 * @param message 消息
	 */
	addToTaskMap(messageId: string, message: StreamResponse, run: boolean = true) {
		console.log(`[addToTaskMap] 开始添加任务，消息ID: ${messageId}, 是否立即执行: ${run}`)
		const task = this.taskMap[messageId]

		if (task) {
			// 将消息分割成单个字符并添加到任务队列
			const slicedMessages = sliceMessage(message)
			task.tasks.push(...slicedMessages)

			if (task.status === "init") {
				task.status = "doing"
			}

			if (!task.triggeredRender && run) {
				this.executeType(messageId)
			}
		} else {
			// 创建新任务并添加消息
			const slicedMessages = sliceMessage(message)
			this.taskMap[messageId] = {
				status: "init",
				tasks: slicedMessages,
				triggeredRender: false,
			}

			if (run) {
				this.executeType(messageId)
			}
		}
	}

	/**
	 * 判断是否存在任务
	 * @param messageId 消息ID
	 * @returns 是否存在任务
	 */
	hasTask(messageId: string) {
		return this.taskMap[messageId]
	}

	/**
	 * 完成任务
	 * @param messageId 消息ID
	 */
	finishTask(messageId: string) {
		const task = this.taskMap[messageId]
		if (task) {
			task.status = "done"
		}
	}

	/**
	 * 创建任务对象
	 * @param message 消息
	 * @returns 任务对象
	 */
	static createObject(message?: StreamResponse): StreamMessageTask {
		return {
			status: "init",
			tasks: message ? sliceMessage(message) : [],
			triggeredRender: false,
		}
	}

	/**
	 * 从任务列表中移除任务
	 * @param messageId 消息ID
	 */
	removeFromTaskMap(messageId: string) {
		delete this.taskMap[messageId]
	}

	/**
	 * 改变任务ID
	 * @param oldMessageId 旧消息ID
	 * @param newMessageId 新消息ID
	 */
	changeTaskId(oldMessageId: string, newMessageId: string) {
		this.taskMap[newMessageId] = this.taskMap[oldMessageId]
		delete this.taskMap[oldMessageId]
	}

	/**
	 * 执行任务
	 * @param messageId 消息ID
	 */
	executeType(messageId: string) {
		console.log(`[executeType] 开始执行任务，消息ID: ${messageId}`)
		const task = this.taskMap[messageId]
		if (task) {
			task.triggeredRender = true
			console.log(`[executeType] 任务状态: ${task.status}, 剩余任务数: ${task.tasks.length}`)

			const processNextChunk = () => {
				// 动态调整批处理大小，根据任务状态和剩余任务量
				let batchSize = 1 // 默认批处理大小

				// 如果任务已标记为完成，增加批处理大小以加快处理速度
				if (task.status === "done") {
					// 根据剩余任务量动态调整批处理大小
					const remainingTasks = task.tasks.length
					if (remainingTasks > 100) {
						batchSize = 20 // 大量任务时使用较大批次
					} else if (remainingTasks > 50) {
						batchSize = 10 // 中等数量任务
					} else if (remainingTasks > 20) {
						batchSize = 5 // 较少任务
					} else {
						batchSize = 3 // 少量任务
					}
				}

				if (task.tasks.length > 0) {
					// 获取要处理的批次（不超过剩余任务数量）
					const currentBatch = task.tasks.splice(
						0,
						Math.min(batchSize, task.tasks.length),
					)

					// 处理当前批次的所有消息
					currentBatch.forEach((message) => {
						if (message) {
							this.appendStreamMessage(messageId, message)
						}
					})

					// 计算下一批次的延迟时间
					const maxContentLength = Math.max(
						...currentBatch.map(
							(message) =>
								message?.content?.length ||
								message?.llm_response?.length ||
								message?.reasoning_content?.length ||
								0,
						),
					)

					// 调整延迟时间，使输出更加连贯自然
					let delay = 30 // 基础延迟时间

					// 如果任务已完成，减少延迟时间
					if (task.status === "done") {
						const remainingTasks = task.tasks.length
						if (remainingTasks > 50) {
							delay = 10
						} else if (remainingTasks > 20) {
							delay = 5
						} else {
							delay = 2
						}
					} else {
						// 正常流式输出时，根据内容长度调整延迟
						const charPerMs = 0.3
						delay = Math.max(20, Math.min(maxContentLength / charPerMs, 80))
					}

					setTimeout(() => {
						processNextChunk()
					}, delay)
				} else if (task.status === "done" && task.tasks.length === 0) {
					this.removeFromTaskMap(messageId)
					useStreamMessageStore.getState().markStreamEnd(messageId)
				} else {
					setTimeout(() => {
						processNextChunk()
					}, 20)
				}
			}

			// 开始处理
			processNextChunk()
		} else {
			console.log(`[executeType] 任务不存在，创建新任务: ${messageId}`)
			this.taskMap[messageId] = StreamMessageApplyService.createObject()
		}
	}

	/**
	 * 追加流式消息
	 * @param targetId 目标ID
	 * @param message 消息
	 */
	appendStreamMessage(targetId: string, message: StreamResponse) {
		const { content, reasoning_content, llm_response } = message
		const targetSeqInfo = this.queryMessageInfo(targetId)
		const aISearchSeqInfo = this.queryMessageInfo(
			AiSearchApplyService.getAppMessageIdByLLMResponseSeqId(targetId),
		)

		switch (true) {
			case Boolean(content):
				if (!targetSeqInfo) return
				MessageService.updateMessage(
					targetSeqInfo.conversationId,
					targetSeqInfo.topicId,
					targetSeqInfo.messageId,
					(m) => {
						const textMessage = m.message as TextConversationMessage
						if (textMessage.text) {
							textMessage.text.content = (textMessage.text.content || "") + content
						}
						return m
					},
				)
				break
			case Boolean(llm_response):
				// 更新 ai 搜索缓存数据
				AiSearchApplyService.appendContent(targetId, llm_response)
				break
			case Boolean(reasoning_content):
				if (targetSeqInfo) {
					MessageService.updateMessage(
						targetSeqInfo.conversationId,
						targetSeqInfo.topicId,
						targetSeqInfo.messageId,
						(m) => {
							const textMessage = m.message as
								| TextConversationMessage
								| MarkdownConversationMessage
							switch (true) {
								case textMessage.type === ConversationMessageType.Text:
									if (textMessage.text) {
										textMessage.text.reasoning_content =
											(textMessage.text.reasoning_content || "") +
											reasoning_content
										if (textMessage.text.stream_options) {
											textMessage.text.stream_options.status =
												StreamStatus.Streaming
											textMessage.text.stream_options.stream = true
										}
									}
									break
								case textMessage.type === ConversationMessageType.Markdown:
									if (textMessage.markdown) {
										textMessage.markdown.reasoning_content =
											(textMessage.markdown.reasoning_content || "") +
											reasoning_content
										if (textMessage.markdown.stream_options) {
											textMessage.markdown.stream_options.status =
												StreamStatus.Streaming
											textMessage.markdown.stream_options.stream = true
										}
									}
									break
								default:
									break
							}
							return m
						},
					)
				} else if (aISearchSeqInfo) {
					AiSearchApplyService.appendReasoningContent(targetId, reasoning_content)
				}
				break
			default:
				break
		}
	}

	apply(streamMessage: StreamResponse) {
		console.log(`[apply] 开始应用流式消息，目标序列ID: ${streamMessage.target_seq_id}`)

		const targetSeqInfo = this.queryMessageInfo(streamMessage.target_seq_id)
		const aggregateAISearchCardSeqInfo = this.queryMessageInfo(
			AiSearchApplyService.getAppMessageIdByLLMResponseSeqId(streamMessage.target_seq_id),
		)

		if (!targetSeqInfo && !aggregateAISearchCardSeqInfo) return

		const type = targetSeqInfo?.type ?? aggregateAISearchCardSeqInfo?.type

		switch (type) {
			case ConversationMessageType.Text:
				console.log(`[apply] 处理文本类型消息`)
				this.applyTextStreamMessage(streamMessage)
				break
			case ConversationMessageType.Markdown:
				console.log(`[apply] 处理Markdown类型消息`)
				this.applyMarkdownStreamMessage(streamMessage)
				break
			case ConversationMessageType.AggregateAISearchCard:
				console.log(`[apply] 处理AI搜索卡片类型消息`)
				this.applyAggregateAISearchCardStreamMessage(streamMessage)
				break
			default:
				console.log(`[apply] 未知消息类型，使用默认处理方式`)
				this.applyDefaultStreamMessage(streamMessage)
				break
		}
	}

	/**
	 * 应用文本流式消息
	 * @param streamMessage 流式消息
	 * @param message 消息
	 */
	applyTextStreamMessage(streamMessage: StreamResponse) {
		console.log(`[applyTextStreamMessage] 开始处理文本流式消息，状态: ${streamMessage.status}`)
		const { target_seq_id, reasoning_content, status, content } = streamMessage
		const { messageId, conversationId, topicId } = this.queryMessageInfo(target_seq_id)!

		if ([StreamStatus.Start, StreamStatus.Streaming].includes(status)) {
			if (reasoning_content) {
				console.log(`[applyTextStreamMessage] 处理推理内容`)
				this.addToTaskMap(target_seq_id, streamMessage)
			} else if (content) {
				console.log(`[applyTextStreamMessage] 处理内容`)
				this.addToTaskMap(target_seq_id, streamMessage)
			}
		} else if (status === StreamStatus.End) {
			console.log(`[applyTextStreamMessage] 处理结束状态消息`)
			MessageService.updateMessage(
				conversationId,
				topicId,
				messageId,
				(m) => {
					const textMessage = m.message as TextConversationMessage
					if (textMessage.text) {
						textMessage.text.content = content
						textMessage.text.reasoning_content = reasoning_content
						if (textMessage.text.stream_options) {
							textMessage.text.stream_options.status = StreamStatus.End
						}
					}
					return m
				},
				true,
			)
		}
		this.finishTask(target_seq_id)
		console.log(`[applyTextStreamMessage] 文本流式消息处理完成`)
	}

	getReasoningContentMap(target_seq_id: string) {
		return useStreamMessageStore.getState().getReasoningContentMap(target_seq_id)
	}

	/**
	 * 应用markdown流式消息
	 * @param streamMessage 流式消息
	 * @param message 消息
	 */
	applyMarkdownStreamMessage(streamMessage: StreamResponse) {
		console.log(
			`[applyMarkdownStreamMessage] 开始处理Markdown流式消息，状态: ${streamMessage.status}`,
		)
		const { reasoning_content, content, status, target_seq_id } = streamMessage
		const { messageId, conversationId, topicId } = this.queryMessageInfo(target_seq_id)!

		if ([StreamStatus.Streaming, StreamStatus.Start].includes(status)) {
			if (reasoning_content) {
				console.log(`[applyMarkdownStreamMessage] 处理推理内容`)
				this.addToTaskMap(target_seq_id, streamMessage)
			} else if (content) {
				console.log(`[applyMarkdownStreamMessage] 处理内容`)
				this.addToTaskMap(target_seq_id, streamMessage)
			}
		} else if (status === StreamStatus.End) {
			console.log(`[applyMarkdownStreamMessage] 处理结束状态消息`)
			MessageService.updateMessage(
				conversationId,
				topicId,
				messageId,
				(m) => {
					const markdownMessage = m.message as MarkdownConversationMessage
					if (markdownMessage.markdown) {
						markdownMessage.markdown.content = content
						markdownMessage.markdown.reasoning_content = reasoning_content
						if (markdownMessage.markdown.stream_options) {
							markdownMessage.markdown.stream_options.status = StreamStatus.End
						}
					}
					return m
				},
				true,
			)
		}
		this.finishTask(target_seq_id)
		console.log(`[applyMarkdownStreamMessage] Markdown流式消息处理完成`)
	}

	/**
	 * 应用聚合AI搜索卡片流式消息
	 * @param streamMessage 流式消息
	 * @param message 消息
	 */
	applyAggregateAISearchCardStreamMessage(message: StreamResponse) {
		console.log(
			`[applyAggregateAISearchCardStreamMessage] 开始处理AI搜索卡片流式消息，状态: ${message.status}`,
		)
		const { reasoning_content, llm_response } = message
		const { status, target_seq_id } = message
		const { messageId, conversationId, topicId } = this.queryMessageInfo(
			AiSearchApplyService.getAppMessageIdByLLMResponseSeqId(target_seq_id),
		)!

		if (!isUndefined(status) && [StreamStatus.Streaming, StreamStatus.Start].includes(status)) {
			if (reasoning_content) {
				console.log(`[applyAggregateAISearchCardStreamMessage] 处理推理内容`)
				this.addToTaskMap(target_seq_id, message)
			} else if (llm_response) {
				console.log(`[applyAggregateAISearchCardStreamMessage] 处理LLM响应内容`)
				this.addToTaskMap(target_seq_id, message)
			}
		} else if (status === StreamStatus.End) {
			console.log(`[applyAggregateAISearchCardStreamMessage] 处理结束状态消息`)
			// 更新根问题的回答
			MessageService.updateMessage(
				conversationId,
				topicId,
				messageId,
				(m) => {
					const textMessage = m.message as AggregateAISearchCardConversationMessage
					if (textMessage.aggregate_ai_search_card) {
						textMessage.aggregate_ai_search_card.llm_response = llm_response
						textMessage.aggregate_ai_search_card.reasoning_content = reasoning_content
						if (textMessage.aggregate_ai_search_card.stream_options) {
							textMessage.aggregate_ai_search_card.stream_options.status =
								StreamStatus.End
						}
					}
					return m
				},
				true,
			)
			this.finishTask(target_seq_id)
		}
		console.log(`[applyAggregateAISearchCardStreamMessage] AI搜索卡片流式消息处理完成`)
	}

	applyDefaultStreamMessage(streamMessage: StreamResponse) {
		const { target_seq_id, reasoning_content, status, content } = streamMessage

		if ([StreamStatus.Start, StreamStatus.Streaming].includes(status)) {
			if (reasoning_content) {
				this.addToTaskMap(target_seq_id, streamMessage, false)
			} else if (content) {
				this.addToTaskMap(target_seq_id, streamMessage, false)
			}
		} else if (status === StreamStatus.End) {
			this.finishTask(target_seq_id)
		}
	}
}

export default new StreamMessageApplyService()
