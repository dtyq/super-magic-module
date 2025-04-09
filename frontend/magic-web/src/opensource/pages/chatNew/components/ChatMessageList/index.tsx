import { observer, useLocalObservable } from "mobx-react-lite"
import { useRef, useCallback, useEffect, lazy, Suspense } from "react"
import { useMemoizedFn, useMount } from "ahooks"
import MessageStore from "@/opensource/stores/chatNew/message"
import MessageService from "@/opensource/services/chat/message/MessageService"
import conversationStore from "@/opensource/stores/chatNew/conversation"
import MessageFilePreview from "@/opensource/services/chat/message/MessageFilePreview"
import MagicDropdown from "@/opensource/components/base/MagicDropdown"
import MessageDropdownService from "@/opensource/services/chat/message/MessageDropdownService"
import MessageDropdownStore from "@/opensource/stores/chatNew/messageUI/Dropdown"
import MagicIcon from "@/opensource/components/base/MagicIcon"
import { useTranslation } from "react-i18next"
import { autorun } from "mobx"
import { cx } from "antd-style"
import { DomClassName } from "@/const/dom"
import { debounce, throttle } from "lodash-es"
import type {
	GroupAddMemberMessage,
	GroupCreateMessage,
	GroupUsersRemoveMessage,
	GroupUpdateMessage,
	GroupDisbandMessage,
} from "@/types/chat/conversation_message"
import { ControlEventMessageType, MessageReceiveType } from "@/types/chat"
import { useFontSize } from "@/opensource/providers/AppearanceProvider/hooks"
import AiConversationMessageLoading from "./components/AiConversationMessageLoading"
import BackBottom from "./components/BackBottom"
import RevokeTip from "./components/RevokeTip"
import { useStyles } from "./styles"
import GroupCreateTip from "./components/MessageFactory/components/GroupCreateTip"
import GroupDisbandTip from "./components/MessageFactory/components/GroupDisbandTip"
import GroupUpdateTip from "./components/MessageFactory/components/GroupUpdateTip"
import GroupUsersRemoveTip from "./components/MessageFactory/components/GroupUsersRemoveTip"
import InviteMemberTip from "./components/MessageFactory/components/InviteMemberTip"
import MessageItem from "./components/MessageItem"
import GroupSeenPanelStore, {
	domClassName as GroupSeenPanelDomClassName,
} from "@/opensource/stores/chatNew/groupSeenPanel"


const GroupSeenPanel = lazy(() => import("../GroupSeenPanel"))

let canScroll = true
let isScrolling = false
let lastMessageId = ""

const ChatMessageList = observer(() => {
	const { t } = useTranslation()
	const { fontSize } = useFontSize()
	const { styles } = useStyles({ fontSize })
	const bottomRef = useRef<HTMLDivElement | null>(null)
	const wrapperRef = useRef<HTMLDivElement | null>(null)
	const chatListRef = useRef<HTMLDivElement | null>(null)
	const resizeObserverRef = useRef<ResizeObserver | null>(null)
	const state = useLocalObservable(() => ({
		isLoadingMore: false,
		isAtBottom: true,
		openDropdown: false,
		dropdownPosition: { x: 0, y: 0 },
		setIsLoadingMore: (value: boolean) => {
			state.isLoadingMore = value
		},
		setIsAtBottom: (value: boolean) => {
			state.isAtBottom = value
		},
		setOpenDropdown: (value: boolean) => {
			state.openDropdown = value
		},
		setDropdownPosition: (value: { x: number; y: number }) => {
			state.dropdownPosition = value
		},
		reset() {
			state.isLoadingMore = false
			state.isAtBottom = true
			state.openDropdown = false
			state.dropdownPosition = { x: 0, y: 0 }
		},
	}))

	const renderMessage = useMemoizedFn((message: any) => {
		switch (message.type) {
			case ControlEventMessageType.GroupAddMember:
				return (
					<InviteMemberTip
						key={message.message_id}
						content={message.message as GroupAddMemberMessage}
					/>
				)
			case ControlEventMessageType.GroupCreate:
				return (
					<GroupCreateTip
						key={message.message_id}
						content={message.message as GroupCreateMessage}
					/>
				)
			case ControlEventMessageType.GroupUsersRemove:
				return (
					<GroupUsersRemoveTip
						key={message.message_id}
						content={message.message as GroupUsersRemoveMessage}
					/>
				)
			case ControlEventMessageType.GroupUpdate:
				return (
					<GroupUpdateTip
						key={message.message_id}
						content={message.message as GroupUpdateMessage}
					/>
				)
			case ControlEventMessageType.GroupDisband:
				return (
					<GroupDisbandTip
						key={message.message_id}
						content={message.message as GroupDisbandMessage}
					/>
				)
			default:
		return message.revoked ? (
			<RevokeTip key={message.message_id} senderUid={message.sender_id} />
		) : (
			<MessageItem
				key={message.message_id}
				message_id={message.message_id}
				sender_id={message.sender_id}
				name={message.name}
				avatar={message.avatar}
				is_self={message.is_self ?? false}
				message={message.message}
				unread_count={message.unread_count}
				refer_message_id={message.refer_message_id}
			/>
		)
		}
	})

	const scrollToMessage = useMemoizedFn(
		(
			messageId: string,
			block: "center" | "start" | "end",
			behavior: "smooth" | "auto" = "smooth",
		) => {
			if (wrapperRef.current) {
				const messageElement = wrapperRef.current.querySelector(
					`[data-message-id="${messageId}"]`,
				)
				if (messageElement) {
					canScroll = false
					isScrolling = true
					messageElement.scrollIntoView({ behavior, block })
					setTimeout(() => {
						isScrolling = false
						canScroll = true
					}, 0)
				}
			}
		},
	)

	const scrollToBottom = useMemoizedFn((force?: boolean) => {
		// 不允许滚动
		if (!canScroll && !force) {
			return
		}

		if (bottomRef?.current) {
			isScrolling = true
			bottomRef.current.scrollIntoView({ behavior: "smooth" })
		}

		setTimeout(() => {
			isScrolling = false
			state.setIsAtBottom(true)
			canScroll = true
		}, 0)
	})

	// 加载更多历史消息
	const loadMoreHistoryMessages = useMemoizedFn(async () => {
		console.log('loadMoreHistoryMessages', state.isLoadingMore, MessageStore.hasMoreHistoryMessage)
		if (state.isLoadingMore || !MessageStore.hasMoreHistoryMessage) return
		
		try {
			state.setIsLoadingMore(true)
			canScroll = false

			// 请求历史消息
			await MessageService.getHistoryMessages(
				conversationStore.currentConversation?.id ?? "",
				conversationStore.currentConversation?.current_topic_id ?? "",
			)
		} catch (error) {
			// 发生错误时恢复样式
			if (chatListRef.current) {
				chatListRef.current.style.transform = ""
				chatListRef.current.style.position = ""
			}
		} finally {
			state.setIsLoadingMore(false)
		}
	})

	// 检查滚动位置并处理
	const checkScrollPosition = useMemoizedFn(() => {
		if (!wrapperRef.current) return

		const { scrollTop, clientHeight, scrollHeight } = wrapperRef.current
		const distance = Math.abs(scrollTop + clientHeight - scrollHeight)

		state.setIsAtBottom(distance < 50)
		// 提前加载
		if (scrollTop < 150 && !state.isLoadingMore) {
			loadMoreHistoryMessages()
		}
	})

	// 处理容器大小变化
	const handleResize = useMemoizedFn(() => {
		if (!chatListRef.current || isScrolling) return

		const { messages } = MessageStore
		if (!messages.length) return

		// 如果最后一条消息为空，证明是初始化状态，滚动到底部
		if (!lastMessageId) {
			console.log('handleResize to bottom')
			lastMessageId = messages[messages.length - 1]?.message_id
			scrollToBottom(true)
			return
		}

		// 有新消息，并且不是当前消息，尝试滚动到底部
		const lastMessage = messages[messages.length - 1]
		// 如果是我发送的新消息，滚动到底部，或者是在底部
		if (
			(lastMessage.is_self && lastMessage?.message_id !== lastMessageId) ||
			state.isAtBottom
		) {
			console.log('handleResize send bottom')
			lastMessageId = lastMessage?.message_id
			scrollToBottom(true)
			return
		}

		// 更新 lastMessageId
		lastMessageId = lastMessage?.message_id

		// 其他情况，滚回底部
		if (canScroll && !isScrolling && wrapperRef.current) {
			return wrapperRef.current.scrollTo({
				top: chatListRef.current.clientHeight,
				behavior: "smooth",
			})
		}
	})

	// 切换会话或者话题
	useEffect(() => {
		scrollToBottom(true)
	}, [MessageStore.conversationId, MessageStore.topicId])

	useMount(() => {
		const handleContainerScroll = throttle(() => {
			checkScrollPosition()
		}, 30)

		if (wrapperRef.current) {
			wrapperRef.current.addEventListener("scroll", handleContainerScroll)
		}

		return () => {
			if (wrapperRef.current) {
				wrapperRef.current.removeEventListener("scroll", handleContainerScroll)
			}
		}
	})


	useEffect(() => {
		// 创建 ResizeObserver 实例，监听消息列表高度变化
		resizeObserverRef.current = new ResizeObserver(
			debounce((entries) => {
				const chatList = entries[0]
				if (!chatList) return
				handleResize()
			}, 100),
		)

		// 开始观察
		if (chatListRef.current) {
			resizeObserverRef.current.observe(chatListRef.current)
		}

		// 消息聚焦
		const focusDisposer = autorun(() => {
			if (MessageStore.focusMessageId) {
				scrollToMessage(MessageStore.focusMessageId, "center")
			}
		})

		// 切换会话，重置状态
		const conversationDisposer = autorun(() => {
			if (conversationStore.currentConversation) {
				state.reset()
				lastMessageId = ""
				canScroll = true
			}
		})

		function handleClick(e: MouseEvent) {
			const target = e.target as HTMLElement
			if (target.classList.contains("message-item-menu")) {
				return
			}
			state.setOpenDropdown(false)
		}

		document.addEventListener("click", handleClick)

		return () => {
			focusDisposer()
			conversationDisposer()
			document.removeEventListener("click", handleClick)
			state.reset()
			resizeObserverRef.current?.disconnect()
			resizeObserverRef.current = null
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const handleContainerClick = useCallback((e: React.MouseEvent) => {
		const target = e.target as HTMLElement
		// 从点击元素开始向上查找，直到找到带有 data-message-id 的元素
		const messageElement = target.closest("[data-message-id]")
		const messageId = messageElement?.getAttribute("data-message-id")

		// 如果是图片点击，并且不是表情
		if (target.tagName === "IMG" && target.classList.contains("magic-image")) {
			// 如果是同一张图片，先重置状态
			MessageFilePreview.setPreviewInfo({
				messageId: messageId ?? "",
				conversationId: conversationStore.currentConversation?.id ?? "",
				url: target.getAttribute("src") ?? "",
				fileName: target.getAttribute("alt") ?? "",
			})
		}

		if (messageElement && messageElement.classList.contains(GroupSeenPanelDomClassName)) {
			if (messageId) {
				GroupSeenPanelStore.openPanel(messageId, { x: e.clientX, y: e.clientY })
			}
		} else if (GroupSeenPanelStore.open) {
			GroupSeenPanelStore.closePanel()
		}
	}, [])

	const handleContainerContextMenu = (e: React.MouseEvent) => {
		e.preventDefault()
		const target = e.target as HTMLElement
		if (target.closest(`.${DomClassName.MESSAGE_ITEM}`)) {
			// 从点击元素开始向上查找，直到找到带有 data-message-id 的元素
			const messageElement = target.closest("[data-message-id]")
			const messageId = messageElement?.getAttribute("data-message-id")
			MessageDropdownService.setMenu(messageId ?? "")
			state.setDropdownPosition({ x: e.clientX, y: e.clientY })
			state.setOpenDropdown(true)
		}
	}

	return (
		<div
			className={cx(styles.container)}
			onClick={handleContainerClick}
			onContextMenu={handleContainerContextMenu}
		>
			{state.isLoadingMore && <div className={styles.loadingMore}>加载更多消息...</div>}
			<div
				ref={wrapperRef}
				className={cx(styles.wrapper)}
				// onScroll={handleContainerScroll()}
				style={{ position: "relative", overflow: "auto" }}
			>
				<div
					ref={chatListRef}
					className={cx(styles.chatList)}
					style={{
						willChange: "transform",
					}}
				>
					{MessageStore.messages.map((message) => {
						const item = renderMessage(message)
						return (
							<div
								id={message.message_id}
								key={message.message_id}
								style={{ willChange: "transform" }}
							>
								{item}
							</div>
						)
					})}
					<AiConversationMessageLoading key="ai-conversation-message-loading" />
					<div ref={bottomRef} />
				</div>
				<MagicDropdown
					className="message-item-menu"
					autoAdjustOverflow
					open={state.openDropdown}
					overlayClassName={styles.dropdownMenu}
					trigger={[]}
					overlayStyle={{
						position: "fixed",
						left: state.dropdownPosition.x,
						top: state.dropdownPosition.y,
					}}
					menu={{
						items: MessageDropdownStore.menu.map((item) => {
							if (item.key.startsWith("divider")) {
								return {
									key: item.key,
									type: "divider",
								}
							}
							return {
								icon: item.icon ? (
									<MagicIcon
										color={item.icon.color}
										component={item.icon.component as any}
										size={item.icon.size}
									/>
								) : undefined,
								key: item.key,
								label: t(item.label ?? "", { ns: "interface" }),
								danger: item.danger,
								onClick: () => {
									MessageDropdownService.clickMenuItem(item.key as any)
								},
							}
						}),
					}}
				>
					<div style={{ display: "none" }} />
				</MagicDropdown>
			</div>
			<BackBottom
				visible={!state.isAtBottom}
				onScrollToBottom={() => scrollToBottom(true)}
			/>
			{conversationStore.currentConversation?.receive_type === MessageReceiveType.Group && (
				<Suspense fallback={null}>
					<GroupSeenPanel />
				</Suspense>
			)}
		</div>
	)
})

export default ChatMessageList
