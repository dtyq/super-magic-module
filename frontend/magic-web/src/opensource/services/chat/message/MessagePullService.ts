/* eslint-disable class-methods-use-this */
import { fetchPaddingData } from "@/utils/request"
import { bigNumCompare } from "@/utils/string"
import type { SeqResponse } from "@/types/request"
import { MessageReceiveType, type CMessage } from "@/types/chat"
import { ConversationStatus } from "@/types/chat/conversation"
import { groupBy, last } from "lodash-es"
import { getDataContext } from "@/opensource/providers/DataContextProvider/hooks"
import type {
	AggregateAISearchCardConversationMessage,
	ConversationMessage,
} from "@/types/chat/conversation_message"
import conversationService from "@/opensource/services/chat/conversation/ConversationService"
import MessageStore from "@/opensource/stores/chatNew/message"
import { ChatApi } from "@/apis"
import MessageSeqIdService from "./MessageSeqIdService"
import MessageApplyServices from "./MessageApplyServices"
import ChatMessageApplyServices from "./MessageApplyServices/ChatMessageApplyServices"
import ControlMessageApplyService from "./MessageApplyServices/ControlMessageApplyService"
import type { ApplyMessageOptions } from "./MessageApplyServices/ChatMessageApplyServices/types"
import MessageService from "./MessageService"
import {
	AggregateAISearchCardDataType,
	ConversationMessageStatus,
	ConversationMessageType,
} from "@/types/chat/conversation_message"
import DotsService from "../dots/DotsService"
import { userStore } from "@/opensource/models/user"
import AiSearchApplyService from "./MessageApplyServices/ChatMessageApplyServices/AiSearchApplyService"

interface PullMessagesFromServerOptions {
	conversationId: string
	topicId?: string
	pageSize?: number
	withoutSeqId?: boolean
	loadHistory?: boolean
}

class MessagePullService {
	/** 消息拉取循环 */
	private pullMessageInterval: NodeJS.Timeout | undefined

	/** 消息拉取频率 */
	private messagePullFrequency: number = 1000 * 30

	/** 消息拉取触发次数 */
	private pullTriggerList: string[] = []

	private triggerPromise: Promise<void> | undefined

	/**
	 * 注册消息拉取循环
	 */
	public registerMessagePullLoop() {
		if (this.pullMessageInterval) {
			clearInterval(this.pullMessageInterval)
		}

		this.pullMessageInterval = setInterval(() => {
			this.pullOfflineMessages()
		}, this.messagePullFrequency)
	}

	/**
	 * 注销消息拉取循环
	 */
	public unregisterMessagePullLoop() {
		if (this.pullMessageInterval) {
			clearInterval(this.pullMessageInterval)
		}
	}

	/**
	 * 从服务器拉取指定消息并保存到本地
	 * @param conversationId 会话ID
	 * @param topicId 话题ID
	 * @param pageSize 每页大小
	 * @param order 排序方式
	 * @param withoutSeqId 是否不使用序列号
	 */
	public async pullMessagesFromServer({
		conversationId,
		topicId = "",
		pageSize = 10,
		loadHistory = false,
		withoutSeqId = false,
	}: PullMessagesFromServerOptions): Promise<SeqResponse<ConversationMessage>[]> {
		let pageToken = ""

		if (!withoutSeqId) {
			// 加载历史消息，列表最早一条消息的seq_id
			if (loadHistory) {
				pageToken = MessageStore.firstSeqId
			} else {
				// 加载最新消息，取缓存的seql_id
				pageToken =
					MessageSeqIdService.getConversationPullSeqId(conversationId) ||
					MessageSeqIdService.getConversationRenderSeqId(conversationId) ||
					""
			}
		}

		const res = await ChatApi.getConversationMessages(conversationId, {
			topic_id: topicId,
			limit: pageSize,
			order: "desc",
			page_token: pageToken,
		})

		console.log("pullMessagesFromServer res =======> ", res)

		// if (!res.has_more) {
		// 	MessageStore.setHasMoreHistoryMessage(false)
		// }

		if (res.items && res.items.length > 0) {
			let conversationMessages = res.items
				.filter(
					(item) =>
						ChatMessageApplyServices.isChatHistoryMessage(item.seq) ||
						ControlMessageApplyService.isControlMessageShouldRender(item.seq),
				)
				.map((item) => item.seq)

			// 合并AI搜索消息
			conversationMessages = this.handleCombineAiSearchMessage(conversationMessages)

			// 异步写入数据库
			requestIdleCallback(() => {
				MessageService.addHistoryMessagesToDB(conversationId, conversationMessages)
			})

			// 更新会话的拉取序列号
			MessageSeqIdService.updateConversationPullSeqId(
				conversationId,
				conversationMessages[0]?.seq_id ?? "",
			)

			return conversationMessages
		}
		return []
	}

	/**
	 * 合并AI搜索消息
	 * @param conversationMessages
	 * @returns
	 */
	handleCombineAiSearchMessage(
		conversationMessages: SeqResponse<
			ConversationMessage | AggregateAISearchCardConversationMessage<true>
		>[],
	) {
		let index = conversationMessages.findIndex(
			(item) => item.message.type !== ConversationMessageType.AggregateAISearchCard,
		)

		const array = [] as SeqResponse<ConversationMessage>[]

		if (index > 0) {
			// 有AI搜索消息
			const aiSearchMessages = conversationMessages.slice(0, index) as SeqResponse<
				AggregateAISearchCardConversationMessage<true>
			>[]
			// 符合合并条件
			if (
				aiSearchMessages[0].message.aggregate_ai_search_card?.type ===
				AggregateAISearchCardDataType.PingPong
			) {
				const combinedMessage =
					AiSearchApplyService.combineAiSearchMessage(aiSearchMessages)
				if (combinedMessage) {
					array.push(combinedMessage)
				}
			}
		}

		if (index === -1) index = 0

		while (index < conversationMessages.length) {
			if (
				conversationMessages[index].message.type !==
				ConversationMessageType.AggregateAISearchCard
			) {
				array.push(conversationMessages[index] as SeqResponse<ConversationMessage>)
				index++
			} else {
				let nextIndex = conversationMessages.findIndex(
					(item, i) =>
						item.message.type !== ConversationMessageType.AggregateAISearchCard &&
						i > index,
				)

				if (nextIndex > 0) {
					const aiSearchMessages = conversationMessages.slice(
						index,
						nextIndex,
					) as SeqResponse<AggregateAISearchCardConversationMessage<true>>[]
					const combinedMessage =
						AiSearchApplyService.combineAiSearchMessage(aiSearchMessages)
					if (combinedMessage) {
						array.push(combinedMessage)
					}
				} else {
					nextIndex = conversationMessages.length
				}

				index = nextIndex
			}

			if (index >= conversationMessages.length) {
				break
			}
		}

		return array
	}

	/**
	 * 获取消息列表并反转顺序
	 *
	 * @returns 消息列表
	 */
	private async pullOfficeMessages({ pageToken }: { pageToken: string }) {
		return fetchPaddingData(
			(p) =>
				// ChatApi.messagePull(p).then((res) => ({
				// 	...res,
				// 	items: res.items.reverse(),
				// })),
				ChatApi.messagePull(p),
			[],
			pageToken,
		)
	}

	/**
	 * 获取最近消息列表
	 * @returns 消息列表
	 */
	private async fetchCurrentMessages() {
		return fetchPaddingData(
			(p) =>
				ChatApi.messagePullCurrent(p).then((res) => ({
					...res,
					items: res.items.reverse(),
				})),
			[],
			MessageSeqIdService.getGlobalPullSeqId(),
		)
	}

	/**
	 * 拉取离线消息
	 */
	public async pullOfflineMessages(triggerSeqId?: string) {
		if (triggerSeqId) {
			this.pullTriggerList.push(triggerSeqId)
		}

		console.log("this.pullTriggerList ====> ", this.pullTriggerList)
		console.log("this.triggerPromise ====> ", this.triggerPromise)
		// 如果正在拉取，则不重复拉取
		if (this.triggerPromise) {
			return
		}

		console.log("this.pullTriggerList.length ====> ", this.pullTriggerList.length)

		const organizationCode = userStore.user.userInfo?.organization_code ?? ""

		if (!organizationCode) {
			console.warn("pullOfflineMessages: 当前组织为空")
			return
		}

		const globalPullSeqId = MessageSeqIdService.getOrganizationRenderSeqId(organizationCode)
		this.triggerPromise = this.pullOfficeMessages({ pageToken: globalPullSeqId })
			.then((items) => {
				if (items.length) {
					const sorted = items
						.map((item) => item.seq)
						.sort((a, b) => bigNumCompare(a.seq_id ?? "", b.seq_id ?? ""))
					console.log("sorted ====> ", sorted)
					this.applyMessages(sorted)
					MessageSeqIdService.updateGlobalPullSeqId(last(sorted)?.seq_id ?? "")

					this.pullTriggerList = this.pullTriggerList.filter(
						(item) => bigNumCompare(item, last(sorted)?.seq_id ?? "") > 0,
					)
				}
				this.triggerPromise = undefined

				if (this.pullTriggerList.length > 0) {
					// 还有未拉取的消息，继续拉取
					this.pullOfflineMessages()
				}
			})
			.catch(() => {
				this.triggerPromise = undefined
			})
	}

	/**
	 * 设备初始化登录，初始化数据
	 * @returns
	 */
	public async pullMessageOnFirstLoad(magicId: string, organizationCode: string) {
		if (!organizationCode) {
			console.warn("pullOfflineMessages: 当前组织为空")
			return
		}

		try {
			// 步骤 1: 拉取用户所有的会话
			const conversationShouldHandle = await fetchPaddingData(({ page_token }) => {
				return ChatApi.getConversationList(undefined, {
					status: ConversationStatus.Normal,
					page_token,
				})
			})

			// 步骤 2: 拉取所有会话的用户信息和群组信息
			const {
				[MessageReceiveType.User]: users = [],
				[MessageReceiveType.Ai]: ais = [],
				[MessageReceiveType.Group]: groups = [],
			} = groupBy(conversationShouldHandle, (item) => item.receive_type)

			const { userInfoService, groupInfoService } = getDataContext()

			// 步骤 2-1: 拉取用户信息
			const user_ids = [...users, ...ais].map((u) => u.receive_id)

			// 添加当前用户Id
			if (userStore.user.userInfo?.user_id) user_ids.push(userStore.user.userInfo?.user_id)

			if (user_ids.length > 0) {
				await userInfoService.fetchUserInfos(user_ids, 2)
			}

			// 步骤 2-2: 拉取群组信息
			const group_ids = groups.map((g) => g.receive_id)
			if (group_ids.length > 0) {
				await groupInfoService.fetchGroupInfos(group_ids)
			}

			// 步骤 3: 添加会话, 更新会话列表(先拉完数据再更新视图, 否则数据会重复拉取)
			conversationService.initOnFirstLoad(magicId, organizationCode, conversationShouldHandle)

			// 步骤 4: 拉取最近消息
			const items = await this.fetchCurrentMessages()

			if (items.length > 0) {
				const seqId = last(items)?.seq.seq_id ?? ""
				MessageSeqIdService.updateGlobalPullSeqId(seqId)
				this.applyMessages(items.map((item) => item.seq))
				MessageSeqIdService.checkAllOrganizationRenderSeqId()
			}

			// 步骤 5: 拉取没有消息的会话历史消息
			const conversationIds: string[] = conversationShouldHandle.map((item) => item.id)

			if (conversationIds.length > 0) {
				const data = await ChatApi.batchGetConversationMessages({
					conversation_ids: conversationIds,
					limit: 5,
				})

				const list = [] as SeqResponse<CMessage>[]
				// 如果数据不为空，则组合应用消息列表
				if (data && Object.keys(data).length > 0) {
					// 组合应用消息列表
					const reverseItems = Object.keys(data).reduce((prev, cId) => {
						const c = data[cId].reverse().map((i) => i.seq)
						prev.push(...c)
						return prev
					}, [] as SeqResponse<ConversationMessage>[])

					if (reverseItems.length > 0) {
						list.push(...reverseItems)
					}

					if (list.length > 0) {
						// 应用消息列表
						this.applyMessages(list, { isHistoryMessage: true, sortCheck: false })
					}
				}
			}
		} catch (error) {
			console.error("pullMessageOnFirstLoad error =======> ", error)
		}
	}

	/**
	 * 应用消息
	 * @param messages 消息
	 * @param options 应用选项
	 */
	private applyMessages(
		messages: SeqResponse<CMessage> | SeqResponse<CMessage>[],
		options?: ApplyMessageOptions,
	) {
		messages = Array.isArray(messages) ? messages : [messages]
		// 消息按升序排序
		const currentOrganization = userStore.user.userInfo?.organization_code

		if (!currentOrganization) {
			console.warn("applyMessages: 当前组织为空")
			return
		}

		messages.forEach((message) => {
			// 如果消息的组织编码与当前组织编码不一致，则将消息加入未处理的消息列表
			if (message.organization_code !== currentOrganization) {
				// unhandleMessages.push(message)
				// let organizationSeqId = OrganizationDotsService.getOrganizationDotSeqId(
				// 	message.organization_code,
				// )
				// console.log("organizationSeqId dot", organizationSeqId, message.seq_id)
				// if (!organizationSeqId) {
				// 	organizationSeqId = MessageSeqIdService.getOrganizationRenderSeqId(
				// 		message.organization_code,
				// 	)
				// }
				// console.log("organizationSeqId 2", organizationSeqId)
				// if (bigNumCompare(organizationSeqId, message.seq_id) < 0) {
				const m = message as SeqResponse<ConversationMessage>

				// FIXME: 需要确认, 后移除
				// const magicAccount = useUserStore
				// 	.getState()
				// 	.accounts.find((account) => account.magic_id === message.magic_id)
				
				const organization = userStore.user.magicOrganizationMap?.[m.organization_code]

				const isSelf = organization?.magic_user_id === m.message.sender_id

				if (
					// 是历史消息（FIXME: AI 搜索消息目前没有处理）
					ChatMessageApplyServices.isChatHistoryMessage(message) &&
					// 消息未读
					m.message.status === ConversationMessageStatus.Unread &&
					// 消息的seq_id大于当前组织的渲染序列号
					bigNumCompare(message.seq_id, MessageSeqIdService.getOrganizationRenderSeqId(message.organization_code)) > 0 &&
					// 不是自己发送的消息
					!isSelf
				) {
					console.log("添加组织未读点", message)
					DotsService.addConversationUnreadDots(
						message.organization_code,
						message.conversation_id,
						m.message.topic_id ?? "",
						message.seq_id,
						1,
					)
					// }
				} else {
					console.log("不是该组织的信息，但已应用", {
						seqId: message.seq_id,
						// organizationSeqId,
						organizationCode: message.organization_code,
					})
				}
			} else {
				console.log("applyMessages: 应用消息", message)
				// 如果消息的组织编码与当前组织编码一致，则将消息加入数据库
				MessageApplyServices.applyMessage(message, options)
				MessageSeqIdService.updateOrganizationRenderSeqId(
					message.organization_code,
					message.seq_id,
				)
			}
		})

		// PS: 这块不处理其他组织的信息，而是在切换组织的时候，再拉取该组织的离线消息，再进行apply
		// 延后处理非当前组织的会话消息
		// unhandleMessages.forEach((message) => {
		// 	MessageApplyServices.applyMessage(message)
		// })
	}
}

export default MessagePullService
