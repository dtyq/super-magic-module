import type { SeqResponse } from "../request"
import type { User } from "../user"
import type {
	AggregateAISearchCardConversationMessage,
	ConversationMessage,
} from "./conversation_message"
import type {
	HideConversationMessage,
	MuteConversationMessage,
	TopConversationMessage,
} from "./control_message"
import type { CreateTopicMessage, DeleteTopicMessage, UpdateTopicMessage } from "./topic"
import type { ConversationFromService, OpenConversationMessage } from "./conversation"
import type {
	StartConversationInputMessage,
	EndConversationInputMessage,
} from "./conversation_input"
import type { SeenMessage } from "./seen_message"
import { AddFriendSuccessMessage } from "./control_message"

/** 消息接收方类型 */
export const enum MessageReceiveType {
	Ai = 0,
	/** 用户 */
	User = 1,
	/** 群组 */
	Group = 2,
	/** 系统消息 */
	System = 3,
	/** 云文档 */
	CloudDocument = 4,
	/** 多维表格 */
	MultiTable = 5,
	/** 话题 */
	Topic = 6,
	/** 应用消息 */
	App = 7,
}

/** 最大序号 */
export interface MessageMaxSeqInfo {
	user_local_seq_id?: string
}

/**
 * 服务端推送事件类型
 */
export const enum EventType {
	/** 登录 */
	Login = "login",
	/** 聊天 */
	Chat = "chat",
	/** 流式聊天 */
	Stream = "stream",
	/** 控制 */
	Control = "control",
	/** 创建会话窗口 */
	CreateConversationWindow = "create_conversation_window",
}

/**
 * 服务端推送事件响应
 */
export interface EventResponseMap {
	[EventType.Login]: User.UserInfo
	[EventType.Chat]: { type: "seq"; seq: SeqResponse<CMessage> }
	[EventType.Control]: { type: "seq"; seq: SeqResponse<CMessage> }
	[EventType.Stream]: { type: "seq"; seq: SeqResponse<CMessage> }
	[EventType.CreateConversationWindow]: { conversation: ConversationFromService }
}

/**
 * 服务端推送事件响应结构
 */
export type EventResponse<E extends EventType> = {
	type: E
	payload: EventResponseMap[E]
}

/**
 * 控制事件类型
 */
export enum ControlEventMessageType {
	/** 打开（创建）会话 */
	OpenConversation = "open_conversation",
	/** 创建会话 */
	CreateConversation = "create_conversation",
	/** 已读回执 */
	SeenMessages = "seen_messages",
	/** 创建话题 */
	CreateTopic = "create_topic",
	/** 更新话题 */
	UpdateTopic = "update_topic",
	/** 删除话题 */
	DeleteTopic = "delete_topic",
	/** 设置会话话题 */
	SetConversationTopic = "set_conversation_topic",
	/** 开始会话输入 */
	StartConversationInput = "start_conversation_input",
	/** 结束会话输入 */
	EndConversationInput = "end_conversation_input",
	/** 撤回消息 */
	RevokeMessage = "revoke_message",
	/** 免打扰 */
	MuteConversation = "mute_conversation",
	/** 置顶群聊 */
	TopConversation = "top_conversation",
	/** 隐藏会话 */
	HideConversation = "hide_conversation",
	/** 群聊创建 */
	GroupCreate = "group_create",
	/** 群新增成员消息 */
	GroupAddMember = "group_users_add",
	/** 群解散 */
	GroupDisband = "group_disband",
	/** 群人员退群 */
	GroupUsersRemove = "group_users_remove",
	/** 群更新 */
	GroupUpdate = "group_update",
	/** 添加好友成功 */
	AddFriendSuccess = "add_friend_success",
}

/**
 * 消息
 */
export type CMessage =
	| OpenConversationMessage
	| CreateTopicMessage
	| UpdateTopicMessage
	| DeleteTopicMessage
	| ConversationMessage
	| SeenMessage
	| StartConversationInputMessage
	| EndConversationInputMessage
	| TopConversationMessage
	| MuteConversationMessage
	| HideConversationMessage
	| AggregateAISearchCardConversationMessage<true>
	| AddFriendSuccessMessage
