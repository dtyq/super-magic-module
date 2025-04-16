import { WebSocketReadyState } from "@/types/websocket"
import { platformKey } from "@/utils/storage"
import { makeAutoObservable } from "mobx"

class InterfaceStore {
	readyState: WebSocket["readyState"] = WebSocketReadyState.CLOSED
	isSwitchingOrganization: boolean = false
	isConnecting: boolean = false
	showReloadButton: boolean = false
	isShowStartPageKey = platformKey("isShowStartPage")
	chatPanelSizeKey = platformKey("chatPanel")

	/**
	 * 聊天输入框默认高度
	 */
	chatInputDefaultHeight = 240

	/**
	 * 聊天侧边栏默认宽度
	 */
	chatSiderDefaultWidth = 240

	/**
	 * 是否显示启动页
	 */
	isShowStartPage: boolean = JSON.parse(localStorage.getItem(this.isShowStartPageKey) ?? "true")

	constructor() {
		const chatPanelSize = localStorage.getItem(this.chatPanelSizeKey)
		if (chatPanelSize) {
			const json = JSON.parse(chatPanelSize)
			this.chatInputDefaultHeight = json.chatInputDefaultHeight
			this.chatSiderDefaultWidth = json.chatSiderDefaultWidth
		}

		makeAutoObservable(this)
	}

	closeStartPage() {
		this.isShowStartPage = false
		localStorage.setItem(this.isShowStartPageKey, "false")
	}

	setReadyState(readyState: WebSocket["readyState"]) {
		this.readyState = readyState
	}

	setIsSwitchingOrganization(isSwitchingOrganization: boolean) {
		this.isSwitchingOrganization = isSwitchingOrganization
	}

	setIsConnecting(isConnecting: boolean) {
		this.isConnecting = isConnecting
	}

	setShowReloadButton(showReloadButton: boolean) {
		this.showReloadButton = showReloadButton
	}

	/**
	 * 缓存聊天面板大小
	 */
	cacheChatPanelSize() {
		localStorage.setItem(
			this.chatPanelSizeKey,
			JSON.stringify({
				chatInputDefaultHeight: this.chatInputDefaultHeight,
				chatSiderDefaultWidth: this.chatSiderDefaultWidth,
			}),
		)
	}

	/**
	 * 设置聊天输入框默认高度
	 */
	setChatInputDefaultHeight(height: number) {
		this.chatInputDefaultHeight = height
		this.cacheChatPanelSize()
	}

	/**
	 * 设置聊天侧边栏默认宽度
	 */
	setChatSiderDefaultWidth(width: number) {
		this.chatSiderDefaultWidth = width
		this.cacheChatPanelSize()
	}
}

// 创建全局单例
export const interfaceStore = new InterfaceStore()
